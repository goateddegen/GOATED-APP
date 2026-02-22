import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Star, Users, TrendingUp, Rocket, Crown, ExternalLink, Heart, ShoppingCart, Zap, Sparkles, Award } from 'lucide-react';
import { GoatIcon } from '../components/GoatLogo';

const products = [
  { name: 'Cold Email Mastery', creator: 'Alex Hormozi', price: 497, rating: 4.9, students: 12400, category: 'Course', hot: true },
  { name: 'SDR Playbook 2025', creator: 'Kyle Coleman', price: 79, rating: 4.8, students: 8200, category: 'Playbook', hot: false },
  { name: 'Sales Navigator Hacks', creator: 'Morgan Ingram', price: 297, rating: 4.7, students: 5600, category: 'Course', hot: true },
  { name: 'AI Outreach Templates', creator: 'GOATED AI', price: 49, rating: 4.9, students: 15800, category: 'Templates', hot: true },
  { name: 'Startup Launch Kit', creator: 'Y Combinator', price: 0, rating: 4.6, students: 34000, category: 'Toolkit', hot: false },
  { name: 'TikTok Shop Playbook', creator: 'Gen Z Hustle', price: 197, rating: 4.5, students: 7800, category: 'Course', hot: true },
];

const creators = [
  { name: 'Alex Hormozi', followers: '4.2M', niche: 'Business', earnings: '$2.4M/mo', tier: 'Legendary', avatar: 'AH' },
  { name: 'Morgan Ingram', followers: '180K', niche: 'Sales', earnings: '$340K/mo', tier: 'Elite', avatar: 'MI' },
  { name: 'Kyle Coleman', followers: '95K', niche: 'SaaS Sales', earnings: '$120K/mo', tier: 'Pro', avatar: 'KC' },
  { name: 'Gen Z Hustle', followers: '520K', niche: 'Ecommerce', earnings: '$890K/mo', tier: 'Elite', avatar: 'GZ' },
];

const gradients = ['from-purple-600 to-pink-500', 'from-blue-600 to-cyan-400', 'from-brand to-teal-400', 'from-orange-500 to-red-500', 'from-indigo-500 to-purple-500', 'from-pink-500 to-rose-400'];
const tierColors = { Legendary: '#f59e0b', Elite: '#a855f7', Pro: '#3b82f6' };

export default function MarketPage() {
  const [tab, setTab] = useState('products');

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Store size={28} className="text-brand" />
          <div><h1 className="text-2xl font-bold">Creator Marketplace</h1><p className="text-slate-500">Courses, tools, and creator partnerships</p></div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm"><Rocket size={16} />Launch Product</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'products', label: 'Products', icon: ShoppingCart }, { id: 'creators', label: 'Creators', icon: Users }, { id: 'launchpad', label: 'Launchpad', icon: Rocket }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-brand/15 text-brand border border-brand/30' : 'bg-surface-3 text-slate-400 border border-white/5 hover:text-white'}`}>
            <t.icon size={16} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p, i) => (
            <motion.div key={i} className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden card-hover"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={`h-36 bg-gradient-to-br ${gradients[i]} flex items-center justify-center relative`}>
                {p.hot && <div className="absolute top-3 right-3 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center gap-1"><Zap size={12} />HOT</div>}
                <GoatIcon className="w-12 h-12 text-white/30" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1 text-yellow-400"><Star size={14} fill="currentColor" /><span className="text-sm font-medium">{p.rating}</span></div>
                  <span className="text-xs text-slate-500">({p.students.toLocaleString()} students)</span>
                  <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-slate-400">{p.category}</span>
                </div>
                <h3 className="font-bold text-lg mb-1">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-4">by {p.creator}</p>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">{p.price === 0 ? 'FREE' : `$${p.price}`}</div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm">Get Access</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'creators' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {creators.map((c, i) => (
            <motion.div key={i} className="bg-surface-3 rounded-xl p-5 border border-white/5 card-hover"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-brand/15 flex items-center justify-center text-brand font-bold text-lg">{c.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><h3 className="font-bold text-lg">{c.name}</h3><span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${tierColors[c.tier]}20`, color: tierColors[c.tier] }}>{c.tier}</span></div>
                  <p className="text-sm text-slate-500">{c.niche}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-surface-2 rounded-lg p-3"><div className="text-xs text-slate-500">Followers</div><div className="font-bold">{c.followers}</div></div>
                <div className="bg-surface-2 rounded-lg p-3"><div className="text-xs text-slate-500">Earnings</div><div className="font-bold text-brand">{c.earnings}</div></div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-brand/15 text-brand text-sm font-medium"><Users size={14} />Follow</button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-slate-300 text-sm"><ExternalLink size={14} />Profile</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'launchpad' && (
        <div className="space-y-6">
          <div className="bg-surface-3 rounded-xl p-8 border border-brand/20 text-center">
            <Rocket size={48} className="text-brand mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Creator Launchpad</h2>
            <p className="text-slate-400 mb-6 max-w-xl mx-auto">Launch your product, course, or service to the GOATED community. Get featured, earn commissions, and build your brand.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
              {[{ icon: Crown, title: 'Get Featured', desc: 'Homepage spotlight' }, { icon: Award, title: 'Earn 70%', desc: 'Creator commission' }, { icon: Sparkles, title: 'AI Marketing', desc: 'Auto-promote' }].map((f, i) => (
                <div key={i} className="bg-surface-2 rounded-xl p-4 border border-white/5">
                  <f.icon size={24} className="text-brand mb-2 mx-auto" />
                  <h3 className="font-semibold text-sm">{f.title}</h3>
                  <p className="text-xs text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 px-8 py-3 rounded-xl bg-brand text-black font-bold text-lg mx-auto"><Rocket size={20} />Apply to Launch</button>
          </div>
        </div>
      )}
    </div>
  );
}
