'use client';

import { useState } from 'react';
import { Sparkles, ArrowRight, MessageSquareCode } from 'lucide-react';

interface ConversationalSearchProps {
  value: string;
  onChange: (val: string) => void;
  onSearchSubmit: (overrideQuery?: string) => void;
}

const SUGGESTIONS = [
  'Avoid tight layovers',
  'Least stressful route',
  'Best lounge access',
  'Senior friendly',
  'Budget optimized',
  'Fastest to destination',
];

export default function ConversationalSearch({ value, onChange, onSearchSubmit }: ConversationalSearchProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="glass rounded-2xl p-4 shadow-2xl border border-violet-500/10 flex flex-col gap-3 animate-fade-in-up">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/20">
          <MessageSquareCode size={13} />
        </div>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Gemini AI Travel Advisor
        </span>
        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-violet-600/20 border border-violet-500/30 text-violet-400 font-bold">POWERED</span>
      </div>

      <div className={`relative flex items-center rounded-xl overflow-hidden px-3 py-1.5 transition-all duration-300 border ${
        focused
          ? 'bg-violet-950/30 border-violet-500/50 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
          : 'bg-white/4 border-white/8 hover:border-white/15'
      }`}>
        <Sparkles size={14} className={`mr-2 shrink-0 transition-colors ${focused ? 'text-violet-400 animate-pulse' : 'text-slate-600'}`} />

        <input
          type="text"
          placeholder="e.g. Avoid tight layovers, least stressful journey..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearchSubmit();
            }
          }}
          className="w-full text-sm text-slate-300 bg-transparent outline-none py-1 placeholder-slate-600"
        />

        <button
          onClick={() => onSearchSubmit()}
          className="ml-2 p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 active:scale-95 transition-all shadow-[0_0_8px_rgba(139,92,246,0.3)]"
        >
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onChange(s);
              onSearchSubmit(s);
            }}
            className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-400/40 text-violet-400 px-2 py-1 rounded-full transition-all font-medium hover:text-violet-300"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

