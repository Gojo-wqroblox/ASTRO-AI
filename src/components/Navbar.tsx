import React from 'react';
import { MISSION_PRESETS } from '../data/presets';
import { AtmospherePreset } from '../types';
import {
  Flame,
  Presentation,
  BookOpen,
  Sparkles,
  ChevronDown,
  Orbit,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  isBeginnerMode: boolean;
  onToggleBeginnerMode: () => void;
  onOpenPresentation: () => void;
  onOpenGlossary: () => void;
  onSelectPreset: (preset: AtmospherePreset) => void;
  onStartSafetyDrill: () => void;
  isSafetyDrillActive?: boolean;
  currentPresetId?: string;
  totalGasesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  isBeginnerMode,
  onToggleBeginnerMode,
  onOpenPresentation,
  onOpenGlossary,
  onSelectPreset,
  onStartSafetyDrill,
  isSafetyDrillActive,
  currentPresetId,
  totalGasesCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand identity: NULLG */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-fuchsia-600 shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
            <Orbit className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '20s' }} />
            <Flame className="w-3.5 h-3.5 text-amber-300 absolute inset-0 m-auto animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-widest text-white font-mono flex items-center">
                NULL<span className="text-cyan-400">G</span>
              </h1>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                0-G FIRE SI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-tight hidden md:block">
              Super Intelligence Fire Safety & Combustion Console
            </p>
          </div>
        </div>

        {/* Center / Right Control Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mission Preset Quick Selector */}
          <div className="relative">
            <select
              value={currentPresetId || ''}
              onChange={(e) => {
                const found = MISSION_PRESETS.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              className="appearance-none bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-cyan-500/50 text-slate-200 text-xs font-mono rounded-xl px-3 py-2 pr-8 cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all max-w-[150px] sm:max-w-[210px] truncate shadow-inner"
            >
              <option value="" disabled>
                Load Space Mission...
              </option>
              {MISSION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Safety Drill Button */}
          <button
            onClick={onStartSafetyDrill}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all active:scale-95 border ${
              isSafetyDrillActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-950/80 animate-pulse'
                : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border-rose-500/50 hover:border-rose-400 shadow-md shadow-rose-950/40'
            }`}
            title="Start Astronaut Emergency Safety Drill"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Safety Drill</span>
            <span className="sm:hidden">Drill</span>
          </button>

          {/* Presentation Masterclass Button */}
          <button
            onClick={onOpenPresentation}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-cyan-500/25 active:scale-95"
          >
            <Presentation className="w-4 h-4" />
            <span className="hidden md:inline">Space Presentation</span>
            <span className="md:hidden">Slides</span>
          </button>

          {/* Space Cadet Guide Button */}
          <button
            onClick={onOpenGlossary}
            className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-mono transition-all hover:border-slate-600 active:scale-95"
            title="Everyday Analogies for Beginners"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cadet Guide</span>
          </button>

          {/* Guest Mode vs Crew Specialist Mode Toggle */}
          <button
            onClick={onToggleBeginnerMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono transition-all active:scale-95 ${
              isBeginnerMode
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-900/90 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Guest Mode (Plain Language & Astronomy Explanations)"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {isBeginnerMode ? 'Guest Mode: ON' : 'Crew Specialist'}
            </span>
            <span className="sm:hidden">
              {isBeginnerMode ? 'Guest' : 'Crew'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
