import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const keys = [
  ['1-8', 'Navigate pages'],
  ['⌘K', 'Open search'],
  ['G', 'Toggle GOATED AI'],
  ['S', 'Toggle sidebar'],
  ['?', 'Show keybinds'],
  ['ESC', 'Close modal/overlay'],
];

export default function KeybindsModal() {
  const { setKeybindsOpen } = useStore();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setKeybindsOpen(false)} />
      <div className="relative w-full max-w-md mx-4 rounded-xl bg-surface-1 border border-white/10 shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h2 className="font-semibold flex items-center gap-2"><Keyboard size={20} className="text-brand" />Keyboard Shortcuts</h2>
          <button onClick={() => setKeybindsOpen(false)} className="p-1 rounded text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-1">
          {keys.map(([k, a]) => (
            <div key={k} className="flex justify-between items-center py-2.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
              <span className="text-slate-300">{a}</span>
              <kbd className="px-2.5 py-1 rounded-md bg-surface-2 text-xs font-mono text-slate-400 border border-white/5">{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
