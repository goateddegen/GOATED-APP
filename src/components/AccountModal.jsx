import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Crown, Sparkles, Check, LogOut, ChevronRight, Shield, Zap } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { signIn, signUp, signInWithGoogle, signInWithGithub, signOut, supabase } from '../lib/supabase';

// Admin emails — checked server-side via Supabase roles, not passwords in client
const ADMIN_EMAILS = ['secrdev@gmail.com', 'admin@goated.solutions'];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    color: 'text-slate-400',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/20',
    features: ['500 leads/mo', 'Basic dashboard', 'Community access'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49/mo',
    color: 'text-brand',
    bg: 'bg-brand/10',
    border: 'border-brand/30',
    features: ['Unlimited leads', 'AI call scripts', 'Advanced analytics', 'Priority support', 'Business tools'],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199/mo',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    features: ['Everything in Pro', 'Custom AI models', 'White-label', 'Dedicated CSM', 'API access', 'SSO & SAML'],
  },
];

export default function AccountModal() {
  const { accountModalOpen, setAccountModalOpen, user, setUser, isLoggedIn, setIsLoggedIn, userPlan, setUserPlan } = useStore();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!accountModalOpen) return null;

  const finalizeUser = (userData) => {
    const isAdmin = ADMIN_EMAILS.includes(userData.email?.toLowerCase());
    const u = {
      ...userData,
      isAdmin,
      plan: isAdmin ? 'enterprise' : (userData.plan || 'free'),
      avatar: userData.avatar || userData.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U',
    };
    setUser(u);
    setIsLoggedIn(true);
    setUserPlan(u.plan);
    localStorage.setItem('goated_current_user', JSON.stringify(u));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setLoading(true);

    // Try Supabase auth first
    if (supabase) {
      const { data, error: authErr } = await signIn(email, password);
      setLoading(false);
      if (authErr) { setError(authErr.message); return; }
      if (data?.user) {
        finalizeUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          provider: 'email',
        });
        return;
      }
    }

    // Fallback to localStorage when Supabase not configured
    const storedUsers = JSON.parse(localStorage.getItem('goated_users') || '[]');
    const found = storedUsers.find(u => u.email === email && u.password === password);
    setLoading(false);
    if (!found) { setError('Invalid email or password'); return; }
    finalizeUser(found);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);

    // Try Supabase auth first
    if (supabase) {
      const { data, error: authErr } = await signUp(email, password, { full_name: name });
      setLoading(false);
      if (authErr) { setError(authErr.message); return; }
      if (data?.user) {
        finalizeUser({ id: data.user.id, email, name, provider: 'email' });
        return;
      }
    }

    // Fallback to localStorage
    const storedUsers = JSON.parse(localStorage.getItem('goated_users') || '[]');
    if (storedUsers.find(u => u.email === email)) { setError('Email already registered'); setLoading(false); return; }
    const newUser = { name, email, password, plan: 'free', createdAt: new Date().toISOString() };
    storedUsers.push(newUser);
    localStorage.setItem('goated_users', JSON.stringify(storedUsers));
    setLoading(false);
    finalizeUser(newUser);
  };

  const handleOAuth = async (provider) => {
    setError('');
    setLoading(true);
    const fn = provider === 'google' ? signInWithGoogle : signInWithGithub;
    const { error: authErr } = await fn();
    setLoading(false);
    if (authErr) setError(authErr.message);
    // OAuth redirects — session picked up by onAuthStateChange in App.jsx
  };

  const handleLogout = async () => {
    if (supabase) await signOut();
    setUser(null);
    setIsLoggedIn(false);
    setUserPlan('free');
    localStorage.removeItem('goated_current_user');
    setAccountModalOpen(false);
  };

  const handleUpgrade = (planId) => {
    const updatedUser = { ...user, plan: planId };
    setUser(updatedUser);
    setUserPlan(planId);
    localStorage.setItem('goated_current_user', JSON.stringify(updatedUser));
    const storedUsers = JSON.parse(localStorage.getItem('goated_users') || '[]');
    const idx = storedUsers.findIndex(u => u.email === user.email);
    if (idx !== -1) { storedUsers[idx] = updatedUser; localStorage.setItem('goated_users', JSON.stringify(storedUsers)); }
    setShowPlans(false);
  };

  const currentPlanData = plans.find(p => p.id === userPlan) || plans[0];

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
          // Logged in view
          <div className="p-6">
            {showPlans ? (
              // Plans view
              <div>
                <button onClick={() => setShowPlans(false)} className="text-sm text-slate-400 hover:text-white mb-4 flex items-center gap-1">
                  <ChevronRight size={14} className="rotate-180" /> Back to profile
                </button>
                <h3 className="text-lg font-bold mb-4">Upgrade Your Plan</h3>
                <div className="space-y-3">
                  {plans.map(plan => (
                    <div key={plan.id} className={`rounded-xl p-4 border ${userPlan === plan.id ? plan.border + ' ' + plan.bg : 'border-white/[0.03] bg-surface-2'} transition-all`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${plan.color}`}>{plan.name}</span>
                          {plan.recommended && <span className="text-[10px] bg-brand/20 text-brand px-2 py-0.5 rounded-full font-medium">POPULAR</span>}
                        </div>
                        <span className="font-bold">{plan.price}</span>
                      </div>
                      <ul className="space-y-1 mb-3">
                        {plan.features.map(f => (
                          <li key={f} className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Check size={12} className={plan.color} />{f}
                          </li>
                        ))}
                      </ul>
                      {userPlan === plan.id ? (
                        <div className="text-xs text-center py-2 rounded-lg bg-white/[0.02] text-slate-400">Current Plan</div>
                      ) : (
                        <button onClick={() => handleUpgrade(plan.id)}
                          className={`w-full text-sm font-medium py-2 rounded-lg transition-colors ${plan.recommended ? 'bg-brand text-black hover:bg-brand/90' : 'bg-white/[0.04] text-white hover:bg-white/15'}`}>
                          {plans.indexOf(plan) > plans.findIndex(p => p.id === userPlan) ? 'Upgrade' : 'Switch'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Profile view
              <div>
                {/* Avatar + Info */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${user.isAdmin ? 'bg-gradient-to-br from-yellow-400 via-brand to-purple-500 text-black ring-2 ring-yellow-400/50' : 'bg-gradient-to-br from-brand to-cyan-400 text-black'}`}>
                    {user.isAdmin ? <Shield size={28} /> : (user.avatar || user.name?.slice(0, 2).toUpperCase() || 'U')}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {user.name}
                      {user.isAdmin && <span className="text-[10px] bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold border border-yellow-400/30 flex items-center gap-1"><Zap size={8} />HEAD ADMIN</span>}
                    </h3>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.isAdmin ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30' : `${currentPlanData.bg} ${currentPlanData.color} border ${currentPlanData.border}`}`}>
                      {user.isAdmin ? <Crown size={10} /> : (userPlan === 'enterprise' ? <Crown size={10} /> : <Sparkles size={10} />)}
                      {user.isAdmin ? 'Admin — Full Access' : `${currentPlanData.name} Plan`}
                    </div>
                  </div>
                </div>

                {/* Admin Panel Quick Actions */}
                {user.isAdmin && (
                  <div className="mb-4 p-3 rounded-xl bg-yellow-400/5 border border-yellow-400/20">
                    <div className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1"><Shield size={12} />Admin Controls</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => { setAccountModalOpen(false); useStore.getState().setPage('admin'); }}
                        className="text-xs py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 transition-colors text-left">
                        <div className="font-medium">Dashboard</div>
                        <div className="text-[10px] text-slate-500">View KPIs</div>
                      </button>
                      <button className="text-xs py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 transition-colors text-left">
                        <div className="font-medium">Users</div>
                        <div className="text-[10px] text-slate-500">{(() => { try { return JSON.parse(localStorage.getItem('goated_users') || '[]').length; } catch { return 0; } })()} registered</div>
                      </button>
                      <button className="text-xs py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 transition-colors text-left">
                        <div className="font-medium">API Keys</div>
                        <div className="text-[10px] text-slate-500">Manage</div>
                      </button>
                      <button className="text-xs py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 transition-colors text-left">
                        <div className="font-medium">Billing</div>
                        <div className="text-[10px] text-slate-500">Revenue</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Plan CTA */}
                {userPlan !== 'enterprise' && (
                  <button onClick={() => setShowPlans(true)}
                    className="w-full p-4 rounded-xl border border-brand/20 bg-brand/5 hover:bg-brand/10 transition-all mb-4 text-left group">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-brand flex items-center gap-1.5">
                          <Sparkles size={14} />Upgrade to {userPlan === 'free' ? 'Pro' : 'Enterprise'}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {userPlan === 'free' ? 'Unlock unlimited leads, AI scripts & more' : 'Get custom AI models, API access & SSO'}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-brand group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                )}

                {/* Stats — real, computed (no static dummy numbers v7.5) */}
                {(() => {
                  let leadCount = 0, closedRevenue = 0, winRate = 0;
                  try {
                    const all = useStore.getState().getLeads ? useStore.getState().getLeads() : [];
                    leadCount = all.length;
                    const closed = all.filter(l => l.status === 'closed' || l.status === 'won');
                    closedRevenue = closed.reduce((s, l) => s + (Number(l.dealValue) || 0), 0);
                    const finalized = all.filter(l => ['closed', 'won', 'lost'].includes(l.status));
                    winRate = finalized.length ? Math.round((closed.length / finalized.length) * 100) : 0;
                  } catch { /* falls through to zeros */ }
                  const fmtK = (n) => n >= 1000 ? `${(n/1000).toFixed(n>=10000?0:1)}K` : `${n}`;
                  return (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-surface-2 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-brand">{fmtK(leadCount)}</div>
                        <div className="text-[10px] text-slate-500">Leads in pipeline</div>
                      </div>
                      <div className="bg-surface-2 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-purple-400">${fmtK(closedRevenue)}</div>
                        <div className="text-[10px] text-slate-500">Closed revenue</div>
                      </div>
                      <div className="bg-surface-2 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-cyan-400">{winRate}%</div>
                        <div className="text-[10px] text-slate-500">Win rate</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Logout */}
                <button onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium transition-colors">
                  <LogOut size={16} />Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          // Auth form
          <div className="p-6">
            {/* Tabs */}
            <div className="flex bg-surface-2 rounded-lg p-1 mb-6">
              <button onClick={() => { setTab('login'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'login' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'}`}>
                Login
              </button>
              <button onClick={() => { setTab('register'); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'register' ? 'bg-brand text-black' : 'text-slate-400 hover:text-white'}`}>
                Register
              </button>
            </div>

            <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
                  <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2.5 border border-white/[0.03] focus-within:border-brand/30 transition-colors">
                    <User size={16} className="text-slate-500" />
                    <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2.5 border border-white/[0.03] focus-within:border-brand/30 transition-colors">
                  <Mail size={16} className="text-slate-500" />
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Password</label>
                <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2.5 border border-white/[0.03] focus-within:border-brand/30 transition-colors">
                  <Lock size={16} className="text-slate-500" />
                  <input type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder-slate-500" />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-lg bg-brand text-black font-bold text-sm hover:bg-brand/90 transition-colors disabled:opacity-50">
                {loading ? 'Please wait...' : (tab === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            {/* OAuth divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-white/[0.03]" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">or continue with</span>
              <div className="flex-1 border-t border-white/[0.03]" />
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOAuth('google')} disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-slate-300 hover:bg-surface-3 transition-colors disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button onClick={() => handleOAuth('github')} disabled={loading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-surface-2 border border-white/[0.03] text-sm text-slate-300 hover:bg-surface-3 transition-colors disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </button>
            </div>

            <p className="text-center text-xs text-slate-500 mt-4">
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                className="text-brand hover:underline">
                {tab === 'login' ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
