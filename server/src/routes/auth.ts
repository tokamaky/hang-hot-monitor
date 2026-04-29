import { Router } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  generateTokens,
  refreshAccessToken,
  revokeRefreshToken,
} from '../services/jwt.js';

const router = Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// GitHub OAuth entry: redirect to GitHub
// GET /api/auth/github
// ──────────────────────────────────────────────
router.get('/github', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: 'read:user user:email',
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

// ──────────────────────────────────────────────
// GitHub OAuth callback: exchange code for token, get user info, issue JWT
// GET /api/auth/github/callback
// ──────────────────────────────────────────────
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  const storedState = (req as any).cookies?.oauth_state;

  if (!state || state !== storedState) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_state`);
    return;
  }

  res.clearCookie('oauth_state');

  if (!code) {
    res.redirect(`${process.env.CLIENT_URL}/login?error=missing_code`);
    return;
  }

  try {
    // Exchange code for GitHub access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      },
      { headers: { Accept: 'application/json' } }
    );

    const githubToken = tokenResponse.data.access_token;

    // Get GitHub user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}` },
    });

    const githubUser = userResponse.data;

    // Fetch email if not in user response
    let email = githubUser.email;
    if (!email) {
      const emailsResponse = await axios.get(
        'https://api.github.com/user/emails',
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      const primaryEmail = emailsResponse.data.find(
        (e: any) => e.primary && e.verified
      );
      email = primaryEmail?.email || null;
    }

    // Create or update user
    let user = await prisma.user.findUnique({
      where: { githubId: String(githubUser.id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          githubId: String(githubUser.id),
          username: githubUser.login,
          email,
          avatar: githubUser.avatar_url,
          role: 'user',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar: githubUser.avatar_url },
      });
    }

    // Issue our own JWT
    const { accessToken, refreshToken } = await generateTokens(user.id);

    // Return refresh token via httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    // Redirect back to frontend with access token in URL
    res.redirect(
      `${process.env.CLIENT_URL}/?token=${accessToken}`
    );
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
  }
});

// ──────────────────────────────────────────────
// Refresh Access Token
// POST /api/auth/refresh
// ──────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const refreshToken = (req as any).cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token' });
    return;
  }

  const result = await refreshAccessToken(refreshToken);
  if (!result) {
    res.status(401).json({ error: 'Refresh token expired or invalid' });
    return;
  }

  res.json({ accessToken: result.accessToken });
});

// ──────────────────────────────────────────────
// Logout
// POST /api/auth/logout
// ──────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  const refreshToken = (req as any).cookies?.refreshToken;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }

  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out' });
});

// ──────────────────────────────────────────────
// Get current user info
// GET /api/auth/me
// ──────────────────────────────────────────────
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token' });
    return;
  }

  try {
    const payload = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET!
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, avatar: true, role: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ──────────────────────────────────────────────
// Register (Username/Password)
// POST /api/auth/register
// ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (username.length < 2) {
    res.status(400).json({ error: 'Username must be at least 2 characters' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'user',
      },
    });

    // Issue tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ──────────────────────────────────────────────
// Login (Username/Password)
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    // Issue tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth/refresh',
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
