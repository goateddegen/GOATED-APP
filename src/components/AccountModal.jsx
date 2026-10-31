import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Crown, Sparkles, LogOut, Shield, Zap } from 'lucide-react';
import { useStore, initialsOf } from '../hooks/useStore';
import { signInWithGoogle, signOut, supabase } from '../lib/supabase';
import { isAdminEmail, PRICING, fmtPrice } from '../lib/config';

// Admin identity comes from lib/config.js so nav, keybinds, search, the router
// and this modal can never disagree about who is an operator.

// ─── Auth policy ────────────────────────────────────────────────────────────
// Supabase Auth is the ONLY account system. There is deliberately no
// browser-local fallback: a second, offline account store meant accounts could
// exist on one device and nowhere else, silently diverging from the real user
// table whenever Supabase was unreachable. If auth is down, the app says so
// rather than inventing a session that no backend recognises.
const AUTH_UNAVAILABLE =
  'Accounts are temporarily unavailable. Please try again in a moment.';

// One-time cleanup: drop credentials written by the retired local-account path.
if (typeof window !== 'undefined' && localStorage.getItem('goated_users')) {
  localStorage.removeItem('goated_users');
}

if (!supabase && typeof window !== 'undefined') {
  console.error(
    '[GOATED] Supabase is not configured — sign-in and sign-up are disabled. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
  );
}

function pipelineStats() {
  const s = useStore.getState();
  const seen = new Set();
  const all = [];
  for (const l of [...(s.liveLeads || []), ...(s.noWebsiteLeads || [])]) {
    const key = l.placeId || l.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    all.push(l);
  }
  const closed = all.filter(l => l.status === 'closed' || l.status === 'won');
  const finalized = all.filter(l => ['closed', 'won', 'lost'].includes(l.status));
  return {
    leadCount: all.length,
    closedRevenue: closed.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0),
    winRate: finalized.length ? Math.round((closed.length / finalized.length) * 100) : 0,
  };
}

export default function AccountModal() {
  const { accountModalOpen, setAccountModalOpen, user, setUser, isLoggedIn, setIsLoggedIn, setUserPlan } = useStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!accountModalOpen) return null;

  const finalizeUser = (userData) => {
    const isAdmin = isAdminEmail(userData.email);
    // Never let credential material reach the session object / localStorage.
    const { password: _pw, passwordHash: _ph, salt: _s, ...safeData } = userData;
    const u = {
      ...safeData,
      isAdmin,
      plan: isAdmin ? 'enterprise' : (userData.plan || 'free'),
      // Only ever a photo URL now. Initials are derived at render time where
      // they're needed, so this never holds a two-letter string that a URL
      // check would misread.
      avatar: /^https?:\/\//.test(userData.avatar || '') ? userData.avatar : null,
    };
    setUser(u);
    setIsLoggedIn(true);
    setUserPlan(u.plan);
    localStorage.setItem('goated_current_user', JSON.stringify(u));
  };



  const handleOAuth = async () => {
    setError('');
    if (!supabase) { setError(AUTH_UNAVAILABLE); return; }
    setLoading(true);
    const { error: authErr } = await signInWithGoogle();
    setLoading(false);
    if (authErr) setError(authErr.message);
    // OAuth redirects away; the session is picked up by onAuthStateChange in
    // App.jsx when Google sends the user back.
  };

  const handleLogout = async () => {
    if (supabase) await signOut();
    setUser(null);
    setIsLoggedIn(false);
    setUserPlan('free');
    localStorage.removeItem('goated_current_user');
    setAccountModalOpen(false);
  };

  const stats = isLoggedIn ? pipelineStats() : { leadCount: 0, closedRevenue: 0, winRate: 0 };
  const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : `${n}`;
  const local = PRICING.tiers.local;
  const growth = PRICING.tiers.growth;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={() => setAccountModalOpen(false)} />
      <motion.div
        className="relative w-full max-w-md rounded-2xl bg-surface-1 border border-white/[0.05] shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.03]">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <User size={20} className="text-brand" />
            {isLoggedIn ? 'Account' : 'Sign In'}
          </h2>
          <button onClick={() => setAccountModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/[0.02] text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {isLoggedIn && user ? (
          <div className="p-6">
            <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold ${user.isAdmin ? 'bg-gradient-to-br from-yellow-400 via-brand to-purple-500 text-black ring-2 ring-yellow-400/50' : 'bg-gradient-to-br from-brand to-cyan-400 text-black'}`}>
                    {user.isAdmin
                      ? <Shield size={28} />
                      : (user.avatar && /^https?:\/\//.test(user.avatar)
                          ? <img src={user.avatar} alt="" referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          : initialsOf(user.name))}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {user.name}
                      {user.isAdmin && <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-400/30 flex items-center gap-1"><Zap size={8} />HEAD ADMIN</span>}
                    </h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isAdmin ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : 'bg-brand/10 text-brand border border-brand/30'}`}>
                      {user.isAdmin ? <Crown size={10} /> : <Sparkles size={10} />}
                      {user.isAdmin ? 'Admin — Full Access' : 'Operator — $0 to use'}
                    </div>
                  </div>
                </div>

                {user.isAdmin && (
                  <div className="mb-4 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                    <div className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1"><Shield size={12} />Admin Controls</div>
                    <button onClick={() => { setAccountModalOpen(false); useStore.getState().setPage('admin'); }}
                      className="w-full text-xs py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 transition-colors text-left">
                      <div className="font-medium">Open admin dashboard</div>
                      <div className="text-[10px] text-slate-500">Health, keys, and live KPIs</div>
                    </button>
                  </div>
                )}

                <div className="rounded-xl border border-white/[0.05] bg-surface-2 p-4 mb-4">
                  <div className="text-xs font-bold text-slate-300 mb-2">What you sell</div>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{local.label}</div>
                        <div className="text-[11px] text-slate-500">Brick & mortar missed-call cover</div>
                      </div>
                      <div className="text-sm font-bold text-brand whitespace-nowrap">{fmtPrice(local.setup)} + {fmtPrice(local.retainer)}/mo</div>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-white">{growth.label}</div>
                        <div className="text-[11px] text-slate-500">Audit + outbound + custom build</div>
                      </div>
                      <div className="text-sm font-bold text-purple-400 whitespace-nowrap">{fmtPrice(growth.setupMin)}–{fmtPrice(growth.setupMax)}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-3">
                    Your seat is free. {PRICING.commission.flat}% only lands when a deal you sourced actually closes.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-surface-2 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-brand">{fmtK(stats.leadCount)}</div>
                    <div className="text-[10px] text-slate-500">Saved leads</div>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-purple-400">${fmtK(stats.closedRevenue)}</div>
                    <div className="text-[10px] text-slate-500">Closed revenue</div>
                  </div>
                  <div className="bg-surface-2 rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">{stats.winRate}%</div>
                    <div className="text-[10px] text-slate-500">Win rate</div>
                  </div>
                </div>

                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors">
                  <LogOut size={16} />Sign Out
                </button>
            </div>
          </div>
        ) : (
          // Auth form — Google OAuth only.
          //
          // The email/password form and the GitHub button were removed
          // deliberately. Password auth meant maintaining a credential flow
          // (confirmation emails, resets, lockouts) for no benefit, and GitHub
          // is the wrong identity for local-service-business operators. One
          // provider also means one thing to configure and one thing to break.
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mx-auto mb-3">
                <Shield size={22} className="text-brand" />
              </div>
              <h3 className="text-lg font-bold text-white">Sign in to GOATED</h3>
              <p className="text-xs text-slate-400 mt-1">
                Use your Google account. No password to remember.
              </p>
            </div>

            <button onClick={handleOAuth} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg bg-white text-slate-800 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50">
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {loading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-center text-[11px] text-slate-500 mt-5 leading-relaxed">
              By continuing you agree to our terms. We only read your name, email
              and avatar.
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
