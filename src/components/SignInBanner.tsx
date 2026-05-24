import { useEffect, useState } from 'react';
import { useAuth } from '../store/authStore';

const DISMISS_KEY = 'ticTacToe.signInBannerDismissed';

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true">
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

export function SignInBanner() {
  const { user, loading, isConfigured, signInWithGoogle } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [busy, setBusy] = useState(false);

  // Auto-rehide once the user signs in.
  useEffect(() => {
    if (user) setDismissed(false); // reset so it returns after future sign-out
  }, [user]);

  if (!isConfigured || loading || user || dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const handleSignIn = async () => {
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch {
      /* errors surface in the header AuthButton */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-600/15 via-fuchsia-600/15 to-violet-600/15 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-4 shadow-lg shadow-violet-500/10 overflow-hidden">
      {/* glow accent */}
      <div className="pointer-events-none absolute -top-12 -left-12 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 items-center justify-center text-lg shadow-lg shadow-violet-500/30">
          ☁️
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm sm:text-base leading-tight">
            Sign in to save your progress
          </p>
          <p className="text-xs sm:text-sm text-violet-200/80 mt-0.5">
            Your wins, losses, and rank are saved to the cloud and travel with you across devices.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={busy}
          className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-all duration-200 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          <span className="hidden sm:inline">Sign in</span>
        </button>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center text-base leading-none"
          title="Dismiss"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
