import React from 'react';
import { ArrowRightLeft, Sparkles, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  onOpenCompare: () => void;
  activeView: 'all' | 'scope' | 'schematic' | 'theory';
  setActiveView: (view: 'all' | 'scope' | 'schematic' | 'theory') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCompare,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 px-4 lg:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <a href="/" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
          <span>RectiSim</span>
        </a>
      </div>

      {/* Zone 2: Clean single-line view links */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-xs font-medium">
        <button
          onClick={() => setActiveView('all')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeView === 'all'
              ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Workbench
        </button>
        <button
          onClick={() => setActiveView('scope')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeView === 'scope'
              ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Oscilloscope
        </button>
        <button
          onClick={() => setActiveView('schematic')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeView === 'schematic'
              ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Schematic
        </button>
        <button
          onClick={() => setActiveView('theory')}
          className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
            activeView === 'theory'
              ? 'bg-slate-800 text-cyan-300 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Theory
        </button>
      </nav>

      {/* Zone 3: Primary Action buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenCompare}
          className="px-3.5 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-800/80 flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span>Compare Topologies</span>
        </button>
      </div>
    </header>
  );
};
