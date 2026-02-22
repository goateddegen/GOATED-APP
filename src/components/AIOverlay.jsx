import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Zap, Shield, Flame, Sparkles, Maximize2, Minimize2, GripVertical, Globe, Users, TrendingUp, Lightbulb } from 'lucide-react';
import { useStore, fmt } from '../hooks/useStore';
import { GoatIcon } from './GoatLogo';

const models = [
  { id: 'goated-v1', name: 'GOATED AI v1', desc: 'Custom model trained on deal data', color: '#10b981', icon: Sparkles },
  { id: 'intelligent', name: 'Intelligent', desc: 'Balanced analysis mode', color: '#3b82f6', icon: Zap },
  { id: 'aggressive', name: 'Aggressive', desc: 'Maximum deal closing mode', color: '#ef4444', icon: Flame },
  { id: 'stealth', name: 'Stealth', desc: 'Competitor research mode', color: '#a855f7', icon: Shield },
];

const quickActions = [
  { label: 'Top leads', icon: Users },
  { label: 'Market trends', icon: TrendingUp },
  { label: 'Start a business idea', icon: Lightbulb },
  { label: 'Global pulse', icon: Globe },
];

export default function AIOverlay() {
  const { setAiOpen, leads, aiModel, setAiModel } = useStore();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Yo! I'm your GOATED AI — the overlay that shits on Cluely. I can find leads, analyze trends, draft outreach, snipe deals, and build your empire. What do you need?" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const endRef = useRef(null);
  const overlayRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Drag support
  const onDragStart = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, dragStart]);

  const send = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      let res = '';
      const lower = msg.toLowerCase();

      if (lower.includes('lead') || lower.includes('find') || lower.includes('top')) {
        const top = leads.slice(0, 5);
        res = `**Top 5 Leads by Score:**\n\n`;
        top.forEach((l, i) => {
          res += `**${i + 1}. ${l.name}** — ${l.company}\n`;
          res += `   Score: ${l.score} | Value: ${fmt(l.dealValue)} | ${l.priority} priority\n`;
          res += `   Best method: ${l.bestMethod} | Timeline: ${l.decisionTimeline}\n\n`;
        });
        res += `\nWant me to draft outreach for any of these?`;
      } else if (lower.includes('business') || lower.includes('idea') || lower.includes('start')) {
        res = `**Business Idea Generator** 🚀\n\nBased on current trends and your pipeline data:\n\n`;
        res += `**1. AI Sales Automation SaaS**\nMarket: $12B by 2028 | Entry: Build on GOATED's lead engine\nMonetize: $99-499/mo SaaS + transaction fees\n\n`;
        res += `**2. Creator Deal Marketplace**\nMarket: $104B creator economy | Entry: GOATED marketplace\nMonetize: 15% commission on deals\n\n`;
        res += `**3. Prediction Market Platform**\nMarket: $50B+ | Entry: GOATED casino module\nMonetize: Platform fees + premium analytics\n\n`;
        res += `Which idea should we deep dive on?`;
      } else if (lower.includes('trend') || lower.includes('market')) {
        res = `**Market Pulse Update** 📊\n\n`;
        res += `🔥 **AI Sales Automation** — +42% this month (BLAZING)\n`;
        res += `📈 **Revenue Intelligence** — +38% (HOT)\n`;
        res += `🎯 **Creator Economy B2B** — +35% (HOT)\n`;
        res += `📉 **Cold Outreach** — -8% (DECLINING)\n\n`;
        res += `Key insight: AI-powered outreach is replacing traditional cold email. Companies using AI SDR tools see 3x higher reply rates.\n\n`;
        res += `Want me to analyze how this impacts your pipeline?`;
      } else if (lower.includes('outreach') || lower.includes('email') || lower.includes('draft')) {
        const lead = leads[0];
        res = `**Draft Outreach for ${lead.name}** ✉️\n\n`;
        res += `Subject: ${lead.company}'s ${lead.painPoints[0]?.split(' ').slice(0, 3).join(' ')}\n\n`;
        res += `Hi ${lead.name.split(' ')[0]},\n\n`;
        res += `Noticed ${lead.company} is ${lead.buyingSignals[0]?.toLowerCase() || 'scaling fast'}. We help ${lead.industry} companies eliminate ${lead.painPoints[0]?.toLowerCase() || 'manual work'}.\n\n`;
        res += `Quick 15-min call this week?\n\nBest,\nGOATED Solutions\n\n`;
        res += `---\nConversion probability: ${lead.conversionProbability}%\nRecommended: ${lead.bestMethod}`;
      } else if (lower.includes('help')) {
        res = `**GOATED AI Commands:**\n\n`;
        res += `• "Find top leads" — Show highest-scored leads\n`;
        res += `• "Market trends" — Real-time market pulse\n`;
        res += `• "Draft outreach" — Auto-generate emails\n`;
        res += `• "Business idea" — AI business generator\n`;
        res += `• "Analyze [company]" — Deep company intel\n`;
        res += `• "Pipeline review" — Full pipeline analysis\n\n`;
        res += `Using model: **${models.find(m => m.id === aiModel)?.name}**`;
      } else {
        const model = models.find(m => m.id === aiModel);
        res = `Processing with **${model?.name}** model...\n\n`;
        res += `Based on your query, here's what I found:\n\n`;
        res += `• Your pipeline has ${leads.length.toLocaleString()} leads worth ${fmt(leads.reduce((s, l) => s + l.dealValue, 0))}\n`;
        res += `• ${leads.filter(l => l.priority === 'critical').length} critical leads need attention\n`;
        res += `• ${leads.filter(l => l.momentum === 'rising').length} leads have rising momentum\n\n`;
        res += `What specific analysis do you need?`;
      }

      setMessages(p => [...p, { role: 'assistant', content: res }]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  };

  const currentModel = models.find(m => m.id === aiModel) || models[0];

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
        <button onClick={() => setMinimized(false)}
          className="w-14 h-14 rounded-full bg-brand flex items-center justify-center shadow-lg neon-border" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
          <GoatIcon className="w-8 h-8 text-black" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAiOpen(false)} />
      <div ref={overlayRef}
        className="absolute inset-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:top-12 w-full sm:max-w-[420px] sm:rounded-2xl bg-surface-1 border-0 sm:border border-white/10 flex flex-col overflow-hidden shadow-2xl"
        style={{ transform: `translate(${position.x}px, ${position.y}px)`, animation: 'slideInRight 0.3s ease-out' }}>

        {/* Header */}
        <div className="p-4 border-b border-white/5" style={{ background: `linear-gradient(135deg, ${currentModel.color}10, transparent)` }}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-3">
              <div className="text-brand"><GoatIcon /></div>
              <div>
                <div className="font-bold flex items-center gap-2">GOATED AI <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /></div>
                <div className="text-xs text-slate-500">Your AI sales copilot</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onMouseDown={onDragStart} className="p-1.5 rounded text-slate-500 hover:text-white cursor-grab active:cursor-grabbing"><GripVertical size={16} /></button>
              <button onClick={() => setMinimized(true)} className="p-1.5 rounded text-slate-500 hover:text-white"><Minimize2 size={16} /></button>
              <button onClick={() => setAiOpen(false)} className="p-1.5 rounded text-slate-500 hover:text-white"><X size={16} /></button>
            </div>
          </div>

          {/* Model selector */}
          <div className="flex gap-1.5">
            {models.map(m => (
              <button key={m.id} onClick={() => setAiModel(m.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${aiModel === m.id ? `border` : 'bg-surface-2 text-slate-500 hover:text-slate-300'}`}
                style={aiModel === m.id ? { background: `${m.color}15`, color: m.color, borderColor: `${m.color}40` } : {}}>
                <m.icon size={12} />{m.name.split(' ').pop()}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand text-black rounded-br-md'
                  : 'bg-surface-2 text-slate-200 rounded-bl-md'
              }`}>
                {m.content.split('**').map((part, j) => j % 2 ? <strong key={j}>{part}</strong> : part)}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex justify-start">
              <div className="bg-surface-2 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-slate-500" style={{ animation: `bounce 0.6s ${i * 0.15}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => { setInput(a.label); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-2 border border-white/5 text-xs text-slate-400 hover:text-white hover:border-brand/30 whitespace-nowrap transition-all">
              <a.icon size={12} />{a.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <input type="text" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask GOATED AI anything..."
              className="flex-1 px-4 py-2.5 bg-surface-2 border border-white/5 rounded-xl text-sm outline-none focus:border-brand/30 transition-colors placeholder-slate-500" />
            <button onClick={send}
              className="px-4 py-2.5 rounded-xl bg-brand text-black font-medium transition-all hover:shadow-lg hover:shadow-brand/20">
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
