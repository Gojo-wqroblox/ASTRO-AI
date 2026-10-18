import React, { useState } from 'react';
import { AVAILABLE_GASES, AVAILABLE_FUELS } from '../data/gases';
import { GasDefinition, FuelDefinition } from '../types';
import { Sliders, Zap, Info, Shield, Gauge, Compass, AlertTriangle, Filter, CheckCircle } from 'lucide-react';

interface GasMixerPanelProps {
  gases: Record<string, number>;
  onGasChange: (gasId: string, value: number) => void;
  pressureKpa: number;
  onPressureChange: (value: number) => void;
  gravityG: number;
  onGravityChange: (value: number) => void;
  ventilationSpeed: number;
  onVentilationChange: (value: number) => void;
  selectedFuel: FuelDefinition;
  onFuelChange: (fuel: FuelDefinition) => void;
  isBeginnerMode: boolean;
}

export const GasMixerPanel: React.FC<GasMixerPanelProps> = ({
  gases,
  onGasChange,
  pressureKpa,
  onPressureChange,
  gravityG,
  onGravityChange,
  ventilationSpeed,
  onVentilationChange,
  selectedFuel,
  onFuelChange,
  isBeginnerMode,
}) => {
  const [activeTab, setActiveTab] = useState<'gases' | 'environment' | 'fuel'>('gases');
  const [gasCategoryFilter, setGasCategoryFilter] = useState<'all' | 'oxidizer' | 'fuel' | 'diluent' | 'suppressant'>('all');
  const [hoveredGas, setHoveredGas] = useState<GasDefinition | null>(null);

  // Filter gases by role
  const filteredGases = AVAILABLE_GASES.filter((g) => {
    if (gasCategoryFilter === 'all') return true;
    return g.role === gasCategoryFilter;
  });

  // Quick gas injection
  const handleQuickInject = (gasId: string, amount: number) => {
    const current = gases[gasId] || 0;
    onGasChange(gasId, Math.min(100, Math.max(0, current + amount)));
  };

  // Compute active gases for top composition breakdown bar
  const activeGasesList = AVAILABLE_GASES.filter((g) => (gases[g.id] || 0) > 0.5);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl flex flex-col h-full">
      {/* Header and Sub Tabs */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
            Gas Mixology & Chamber Controls
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('gases')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'gases'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gases ({AVAILABLE_GASES.length})
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'environment'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gravity & Fans
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              activeTab === 'fuel'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fuels
          </button>
        </div>
      </div>

      {/* Atmospheric Composition Breakdown Bar */}
      <div className="mb-3 p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>ATMOSPHERE SPECTRUM:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {activeGasesList.slice(0, 5).map((g) => (
              <span key={g.id} className="text-[10px]">
                <strong style={{ color: g.color }}>{g.chemicalFormula}</strong>: {(gases[g.id] || 0).toFixed(1)}%
              </span>
            ))}
          </div>
        </div>
        {/* Visual Segment Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-800">
          {activeGasesList.map((g) => {
            const pct = gases[g.id] || 0;
            return (
              <div
                key={g.id}
                style={{ width: `${Math.min(100, pct)}%`, backgroundColor: g.color }}
                className="h-full transition-all duration-300"
                title={`${g.name}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Tab 1: Multi-Gas Mixers */}
      {activeTab === 'gases' && (
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
          {/* Category Filter Pills & Quick Ingress */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1">
              {(['all', 'oxidizer', 'fuel', 'diluent', 'suppressant'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGasCategoryFilter(cat)}
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-lg border transition-all ${
                    gasCategoryFilter === cat
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Ingress Triggers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleQuickInject('H2', 15)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 transition-all"
                title="Inject 15% Hydrogen Leak"
              >
                +15% H₂ Ghost
              </button>
              <button
                onClick={() => handleQuickInject('SiH4', 3)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all"
                title="Inject 3% Pyrophoric Silane"
              >
                +3% SiH₄ Auto-Fire
              </button>
              <button
                onClick={() => handleQuickInject('SF6', 15)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 transition-all"
                title="Inject 15% Heavy Dielectric SF6"
              >
                +15% SF₆ Blanket
              </button>
              <button
                onClick={() => handleQuickInject('Novec', 15)}
                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
                title="Inject 15% FK-5-1-12 Clean Agent"
              >
                +15% FK-5-1-12
              </button>
            </div>
          </div>

          {/* Gas Sliders Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {filteredGases.map((gas) => {
              const currentVal = gases[gas.id] || 0;

              return (
                <div
                  key={gas.id}
                  onMouseEnter={() => setHoveredGas(gas)}
                  onMouseLeave={() => setHoveredGas(null)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    currentVal > 0
                      ? 'bg-slate-950/80 border-slate-700/80 shadow-sm'
                      : 'bg-slate-950/30 border-slate-800/60 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-sm text-white">
                        {gas.chemicalFormula}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        {gas.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase border ${gas.badgeColor}`}>
                        {gas.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <span className="text-cyan-400 font-bold">{currentVal.toFixed(1)}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={currentVal}
                    onChange={(e) => onGasChange(gas.id, parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />

                  {/* Layperson Mini-Hint */}
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">
                    {isBeginnerMode ? gas.beginnerAnalogy : gas.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Hovered Gas Inspector Card */}
          {hoveredGas && (
            <div className="mt-1 p-3 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs shadow-xl animate-fadeIn">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-cyan-300 font-mono text-sm">
                  {hoveredGas.name} ({hoveredGas.chemicalFormula})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  MW: {hoveredGas.molecularWeight} g/mol | Cp: {hoveredGas.heatCapacityCp} J/mol·K
                </span>
              </div>
              <p className="text-slate-300 text-xs mb-1.5">{hoveredGas.description}</p>
              <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-cyan-200 text-[11px]">
                <strong className="text-cyan-400">Everyday Space Cadet Analogy:</strong> {hoveredGas.beginnerAnalogy}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Gravity, Pressure, and Spacecraft Fans */}
      {activeTab === 'environment' && (
        <div className="flex flex-col gap-4 flex-1 justify-center">
          {/* Gravitational Field Selector */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Gravitational Acceleration (Buoyancy Eliminator)
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400">
                {gravityG === 0 ? '0.00g (Microgravity)' : `${gravityG.toFixed(2)}g`}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              <button
                onClick={() => onGravityChange(0.0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  gravityG === 0
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                0.0g (ISS/Deep Space)
              </button>
              <button
                onClick={() => onGravityChange(0.16)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  gravityG === 0.16
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                0.16g (Lunar Artemis)
              </button>
              <button
                onClick={() => onGravityChange(0.38)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  gravityG === 0.38
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                0.38g (Mars Base)
              </button>
              <button
                onClick={() => onGravityChange(1.0)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  gravityG === 1.0
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                1.0g (Earth 1G)
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="1.5"
              step="0.02"
              value={gravityG}
              onChange={(e) => onGravityChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-400 mt-1 italic">
              {gravityG === 0
                ? '0-G Active: Buoyancy is zero! Flames form quiet blue spheres and suffocate unless ventilation fans blow fresh oxygen.'
                : 'Gravity active: Hot air rises and creates tall, flickering teardrop flames.'}
            </p>
          </div>

          {/* Cabin Total Pressure */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-mono font-semibold text-slate-200">
                  Cabin Total Pressure
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-cyan-400">
                {pressureKpa.toFixed(1)} kPa ({(pressureKpa * 0.145038).toFixed(1)} psi)
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                onClick={() => onPressureChange(101.3)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  Math.abs(pressureKpa - 101.3) < 1
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                101.3 kPa (ISS Sea-Lvl)
              </button>
              <button
                onClick={() => onPressureChange(56.5)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  Math.abs(pressureKpa - 56.5) < 1
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                56.5 kPa (Artemis 8.2 psi)
              </button>
              <button
                onClick={() => onPressureChange(29.6)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono transition-all border ${
                  Math.abs(pressureKpa - 29.6) < 1
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                    : 'bg-slate-900 text-slate-300 border-slate-700'
                }`}
              >
                29.6 kPa (EVA Suit 4.3 psi)
              </button>
            </div>

            <input
              type="range"
              min="20"
              max="130"
              step="1"
              value={pressureKpa}
              onChange={(e) => onPressureChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Forced Air Ventilation / Circulation Speed */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-slate-200">
                Spacecraft Air Circulation / Fan Vector
              </span>
              <span className="font-mono text-xs font-bold text-cyan-400">
                {ventilationSpeed.toFixed(2)} m/s ({ventilationSpeed === 0 ? 'Stagnant' : ventilationSpeed < 0.2 ? 'Gentle Drift' : 'Aggressive Duct Fan'})
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="0.80"
              step="0.02"
              value={ventilationSpeed}
              onChange={(e) => onVentilationChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <p className="text-[11px] text-slate-400 mt-1 italic">
              {ventilationSpeed === 0
                ? 'Zero airflow: The flame cannot receive fresh oxygen and will starve in its own CO₂ sphere.'
                : 'Airflow feeding flame: Forced ventilation blows fresh oxygen across the fuel surface, keeping the fire roaring.'}
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Fuel Type Selection */}
      {activeTab === 'fuel' && (
        <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pr-1">
          <p className="text-xs text-slate-400 mb-1">
            Choose what material or leak is feeding the flame inside the habitat:
          </p>

          {AVAILABLE_FUELS.map((fuel) => {
            const isSelected = selectedFuel.id === fuel.id;
            return (
              <div
                key={fuel.id}
                onClick={() => onFuelChange(fuel)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                    {fuel.name}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    fuel.toxicity === 'Lethal' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    fuel.toxicity === 'High' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                    'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    Toxicity: {fuel.toxicity}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mb-1.5">
                  {isBeginnerMode ? fuel.beginnerDescription : fuel.material}
                </p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                  <span>Ignition: ~{fuel.ignitionTempC}°C</span>
                  <span>Soot Rating: {fuel.sootIndex}/10</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
