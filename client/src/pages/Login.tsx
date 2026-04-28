import { useState } from 'react';
import { Github, User, Lock, Loader2 } from 'lucide-react';
import { useI18n } from '../i18n/index.tsx';
import { authApi } from '../services/api';
import type { CurrentUser } from '../services/api';

interface LoginProps {
  error?: string;
  onLogin: () => void;
  onSuccess: (token: string, user: CurrentUser) => void;
}

export default function Login({ error: oauthError, onLogin, onSuccess }: LoginProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!formData.username.trim()) {
          setFormError(t.login.errors.usernameRequired);
          return;
        }
        if (formData.username.trim().length < 2) {
          setFormError('Username must be at least 2 characters');
          return;
        }
        if (formData.password.length < 6) {
          setFormError(t.login.errors.passwordMinLength);
          return;
        }

        const result = await authApi.register({
          username: formData.username.trim(),
          password: formData.password,
        });
        onSuccess(result.accessToken, result.user);
      } else {
        if (!formData.username.trim()) {
          setFormError(t.login.errors.usernameRequired);
          return;
        }
        if (!formData.password) {
          setFormError(t.login.errors.passwordRequired);
          return;
        }

        const result = await authApi.emailLogin({
          username: formData.username.trim(),
          password: formData.password,
        });
        onSuccess(result.accessToken, result.user);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayError = oauthError || formError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050f] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 bg-[#0a0a1a] p-8 rounded-2xl shadow-2xl border border-white/10 text-center max-w-md w-full mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center"
            style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">{t.login.title}</h1>
        <p className="text-sm text-slate-500 mb-6">{t.login.subtitle}</p>

        {/* Error Message */}
        {displayError && (
          <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-left flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{displayError === 'invalid_state' ? t.login.errors.invalidState :
                   displayError === 'oauth_failed' ? t.login.errors.oauthFailed :
                   displayError === 'missing_code' ? t.login.errors.missingCode :
                   displayError}</span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setFormError(null); }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'login'
                ? 'text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={mode === 'login' ? { background: 'rgba(124,58,237,0.3)' } : {}}
          >
            {t.login.loginTab}
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setFormError(null); }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'register'
                ? 'text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            style={mode === 'register' ? { background: 'rgba(124,58,237,0.3)' } : {}}
          >
            {t.login.registerTab}
          </button>
        </div>

        {/* Username/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder={t.login.usernamePlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-[#0f0f1e] border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t.login.passwordPlaceholder}
              className="w-full pl-10 pr-4 py-3 bg-[#0f0f1e] border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
            style={{ boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            {mode === 'register' ? t.login.registerButton : t.login.emailButton}
          </button>
        </form>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs text-slate-600" style={{ background: '#0a0a1a' }}>or</span>
          </div>
        </div>

        {/* GitHub Login */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all active:scale-[0.98]"
        >
          <Github className="w-5 h-5" />
          {t.login.githubButton}
        </button>

        <div className="mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.login.notice}
          </p>
        </div>
      </div>
    </div>
  );
}
