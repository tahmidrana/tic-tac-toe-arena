import { useState } from 'react';
import { useAuth } from '../store/authStore';
import { ProfileSettingsModal } from './ProfileSettingsModal';

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
    <path
      d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

export function AuthButton() {
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  if (!isConfigured) {
    return null; // No Firebase env vars — keep header clean.
  }

  if (loading) {
    return <div className="h-9 w-24 rounded-xl bg-white/5 animate-pulse" />;
  }

  const handleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      // Suppress the common "user closed popup" error.
      if (!/popup-closed|cancelled/i.test(msg)) setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleSignIn}
          disabled={busy}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          <span className="hidden sm:inline">Sign in with Google</span>
          <span className="sm:hidden">Sign in</span>
        </button>
        {error && <span className="text-[10px] text-red-400 max-w-[200px] truncate">{error}</span>}
      </div>
    );
  }

  const displayName = user.displayName || user.email || 'Player';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/40 transition-all duration-200 group"
        title="Profile settings"
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt=""
            className="w-6 h-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
            {initial}
          </div>
        )}
        <span className="hidden sm:inline text-xs sm:text-sm font-semibold text-white max-w-[100px] sm:max-w-[160px] truncate">
          {displayName}
        </span>
        <svg className="w-3 h-3 text-slate-500 group-hover:text-violet-400 transition-colors hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {showProfile && <ProfileSettingsModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
