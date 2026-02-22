import React from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Download, Plus, Phone, Mail, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useStore, fmt, priorities, statuses } from '../hooks/useStore';

const priorityColors = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};
const statusColors = {
  won: 'bg-emerald-500/15 text-emerald-400', lost: 'bg-red-500/15 text-red-400',
  negotiation: 'bg-yellow-500/15 text-yellow-400', proposal: 'bg-purple-500/15 text-purple-400',
  qualified: 'bg-blue-500/15 text-blue-400', contacted: 'bg-cyan-500/15 text-cyan-400',
  new: 'bg-slate-500/15 text-slate-400',
};

export default function LeadsPage({ onSelect }) {
  const { search, setSearch, filterPriority, setFilterPriority, filterStatus, setFilterStatus, getFilteredLeads } = useStore();
  const leads = getFilteredLeads();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users size={28} className="text-brand" />
          <div><h1 className="text-2xl font-bold">Lead Intelligence</h1><p className="text-slate-500">{leads.length.toLocaleString()} leads</p></div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-white/10 text-sm"><Download size={16} />Export</button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-black font-medium text-sm"><Plus size={16} />Add Lead</button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface-3 rounded-xl p-4 border border-white/5 flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" placeholder="Search leads, companies, industries..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-white/5 rounded-lg text-sm text-white placeholder-slate-500 outline-none focus:border-brand/30 transition-colors" />
        </div>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="px-3 py-2.5 bg-surface-1 border border-white/5 rounded-lg text-sm text-white outline-none">
          <option value="all">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 bg-surface-1 border border-white/5 rounded-lg text-sm text-white outline-none">
          <option value="all">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-3 rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['#', 'Lead', 'Company', 'Score', 'Value', 'Priority', 'Status', 'Momentum', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-slate-500 font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 50).map((l, i) => (
                <motion.tr key={l.id} onClick={() => onSelect(l)}
                  className="border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                  <td className="px-4 py-3 font-bold text-slate-500 text-sm">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                        {l.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0"><div className="font-medium text-sm truncate">{l.name}</div><div className="text-xs text-slate-500 truncate">{l.title}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{l.company}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface-2 rounded-full overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${l.score}%` }} /></div>
                      <span className="font-bold text-brand text-sm">{l.score}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{fmt(l.dealValue)}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[l.priority]}`}>{l.priority}</span></td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[l.status]}`}>{l.status}</span></td>
                  <td className="px-4 py-3">
                    <span className={l.momentum === 'rising' ? 'text-brand' : l.momentum === 'declining' ? 'text-red-400' : 'text-yellow-400'}>
                      {l.momentum === 'rising' ? <ArrowUp size={16} /> : l.momentum === 'declining' ? <ArrowDown size={16} /> : <Minus size={16} />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={e => e.stopPropagation()} className="p-2 rounded-lg text-slate-500 hover:text-brand hover:bg-brand/10 transition-colors"><Phone size={14} /></button>
                      <button onClick={e => e.stopPropagation()} className="p-2 rounded-lg text-slate-500 hover:text-brand hover:bg-brand/10 transition-colors"><Mail size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {leads.length > 50 && (
          <div className="px-4 py-3 text-center text-sm text-slate-500 border-t border-white/5">
            Showing 50 of {leads.length.toLocaleString()} leads
          </div>
        )}
      </div>
    </div>
  );
}
