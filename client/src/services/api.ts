const API_BASE = `${import.meta.env.VITE_API_URL || ''}/api`;

// ─── Auth state (in-memory for security) ───
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
  sessionStorage.setItem('accessToken', token);
};

export const clearAccessToken = () => {
  accessToken = null;
  sessionStorage.removeItem('accessToken');
};

export const getAccessToken = () => {
  return accessToken || sessionStorage.getItem('accessToken');
};

// ─── Auth API ───
export const authApi = {
  githubLogin: () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/github`;
  },

  register: (data: { username: string; password: string }) => {
    return fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(error.error || 'Registration failed');
      }
      return res.json();
    });
  },

  emailLogin: (data: { username: string; password: string }) => {
    return fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error.error || 'Login failed');
      }
      return res.json();
    });
  },

  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    clearAccessToken();
  },

  getMe: () => {
    return fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    }).then(async (res) => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    });
  },

  getMeWithToken: (token: string) => {
    return fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async (res) => {
      if (!res.ok) throw new Error('Not authenticated');
      return res.json();
    });
  },

  refresh: () => {
    return fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).then(async (res) => {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    });
  },
};

// ─── Request helper with auto-refresh ───
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Auto-refresh on 401
  if (response.status === 401 && !(options.headers as Record<string, string> | undefined)?.['Authorization']) {
    try {
      const { accessToken: newToken } = await authApi.refresh();
      setAccessToken(newToken);
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch {
      clearAccessToken();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ─── Types ───
export interface Keyword {
  id: string;
  text: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { hotspots: number };
}

export interface Hotspot {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  sourceId: string | null;
  isReal: boolean;
  relevance: number;
  relevanceReason: string | null;
  keywordMentioned: boolean | null;
  importance: 'low' | 'medium' | 'high' | 'urgent';
  summary: string | null;
  viewCount: number | null;
  likeCount: number | null;
  retweetCount: number | null;
  replyCount: number | null;
  commentCount: number | null;
  quoteCount: number | null;
  danmakuCount: number | null;
  authorName: string | null;
  authorUsername: string | null;
  authorAvatar: string | null;
  authorFollowers: number | null;
  authorVerified: boolean | null;
  publishedAt: string | null;
  createdAt: string;
  keyword: { id: string; text: string; category: string | null } | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  hotspotId: string | null;
  createdAt: string;
}

export interface Stats {
  total: number;
  today: number;
  urgent: number;
  bySource: Record<string, number>;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  avatar: string | null;
  role: string;
}

// Keywords API
export const keywordsApi = {
  getAll: () => request<Keyword[]>('/keywords'),

  getById: (id: string) => request<Keyword>(`/keywords/${id}`),

  create: (data: { text: string; category?: string }) =>
    request<Keyword>('/keywords', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Keyword>) =>
    request<Keyword>(`/keywords/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/keywords/${id}`, { method: 'DELETE' }),

  toggle: (id: string) =>
    request<Keyword>(`/keywords/${id}/toggle`, { method: 'PATCH' }),
};

// Hotspots API
export const hotspotsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    source?: string;
    importance?: string;
    keywordId?: string;
    isReal?: string;
    timeRange?: string;
    timeFrom?: string;
    timeTo?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') searchParams.append(key, String(value));
      });
    }
    return request<{ data: Hotspot[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/hotspots?${searchParams}`
    );
  },

  getStats: () => request<Stats>('/hotspots/stats'),

  getById: (id: string) => request<Hotspot>(`/hotspots/${id}`),

  search: (query: string, sources?: string[]) =>
    request<{ results: Hotspot[] }>('/hotspots/search', {
      method: 'POST',
      body: JSON.stringify({ query, sources }),
    }),

  delete: (id: string) =>
    request<void>(`/hotspots/${id}`, { method: 'DELETE' }),
};

// Notifications API
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) searchParams.append(key, String(value));
      });
    }
    return request<{ data: Notification[]; unreadCount: number; pagination: any }>(
      `/notifications?${searchParams}`
    );
  },

  markAsRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllAsRead: () =>
    request<void>('/notifications/read-all', { method: 'PATCH' }),

  delete: (id: string) =>
    request<void>(`/notifications/${id}`, { method: 'DELETE' }),

  clear: () =>
    request<void>('/notifications', { method: 'DELETE' }),
};

// Settings API
export const settingsApi = {
  getAll: () => request<Record<string, string>>('/settings'),

  update: (settings: Record<string, string>) =>
    request<void>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
};

// Manual trigger (public endpoint)
export const triggerHotspotCheck = () =>
  request<{ message: string }>('/check-hotspots', { method: 'POST' });
