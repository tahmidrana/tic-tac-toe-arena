import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../store/authStore';
import { useGlobalLeaderboard } from '../store/leaderboardStore';

interface Props {
  onClose: () => void;
  onSignOut?: () => void;
}

export function ProfileSettingsModal({ onClose, onSignOut }: Props) {
  const { user, updateDisplayName, signOut } = useAuth();
  const { currentUser: lbUser } = useGlobalLeaderboard();

  const displayName = user?.displayName || user?.email || 'Player';
  const initial = displayName.charAt(0).toUpperCase();

  const [name, setName] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const isDirty = name.trim() !== displayName;

  const handleSave = async () => {
    if (!isDirty || saving) return;
    setError(null);
    setSaving(true);
    try {
      await updateDisplayName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    setSigningOut(true);
    try {
      await signOut();
      onSignOut?.();
      onClose();
    } finally {
      setSigningOut(false);
    }
  };

  const wins = lbUser?.wins ?? 0;
  const losses = lbUser?.losses ?? 0;
  const draws = lbUser?.draws ?? 0;
  const total = wins + losses + draws;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-violet-500/40 shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 px-6 pt-6 pb-4 border-b border-white/8">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/10"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="relative">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl border-2 border-violet-500/50 shadow-lg shadow-violet-500/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violet-500/30">
                  {initial}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-white leading-tight truncate">{displayName}</h2>
              {user?.email && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{user.email}</p>
              )}
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-semibold">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Google Account
              </span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {total > 0 && (
          <div className="grid grid-cols-4 divide-x divide-white/8 border-b border-white/8">
            {[
              { label: 'Wins', value: wins, color: 'text-emerald-400' },
              { label: 'Losses', value: losses, color: 'text-rose-400' },
              { label: 'Draws', value: draws, color: 'text-amber-400' },
              { label: 'Win %', value: `${winRate}%`, color: 'text-violet-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2">
                <span className={`text-base font-black ${color}`}>{value}</span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Display Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null); setSaved(false); }}
              onKeyDown={handleKeyDown}
              maxLength={32}
              placeholder="Your name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white text-sm font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
            />
            {error && (
              <p className="mt-1.5 text-xs text-rose-400">{error}</p>
            )}
            {saved && (
              <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
                Name updated!
              </p>
            )}
            <p className="mt-1.5 text-[11px] text-slate-500">
              This name appears on the leaderboard and in online games.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all font-semibold text-sm"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            <button
              onClick={() => setShowSignOutConfirm(true)}
              disabled={signingOut}
              className="w-full px-4 py-2.5 rounded-xl bg-rose-600/20 border border-rose-500/30 hover:bg-rose-600/30 hover:border-rose-500/50 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-all disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Sign-out confirmation dialog */}
      {showSignOutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-rose-500/40 shadow-2xl max-w-sm w-full p-6 animate-bounce-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-5">
              <div className="flex justify-center mb-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full border-2 border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xl font-black">
                    {initial}
                  </div>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mb-1.5">
                Sign out?
              </h3>
              <p className="text-sm text-slate-400">
                You'll be signed out as{' '}
                <span className="font-semibold text-white">{displayName}</span>. Your
                stats stay safe in the cloud and will reappear when you sign back in.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                disabled={signingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-slate-300 hover:text-white hover:bg-white/12 transition-all duration-200 font-semibold text-sm disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-semibold text-sm shadow-lg shadow-rose-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
