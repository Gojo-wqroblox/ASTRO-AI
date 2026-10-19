/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AVAILABLE_GASES, AVAILABLE_FUELS } from './data/gases';
import { MISSION_PRESETS } from './data/presets';
import { AtmospherePreset, FuelDefinition, SIAnalysisResult } from './types';
import { analyzeFireSafetySI } from './services/geminiService';
import { Navbar } from './components/Navbar';
import { ChamberCanvas } from './components/ChamberCanvas';
import { GasMixerPanel } from './components/GasMixerPanel';
import { HazardRankerDashboard } from './components/HazardRankerDashboard';
import { FireSafetyRadar } from './components/FireSafetyRadar';
import { PresentationModal } from './components/PresentationModal';
import { CommanderAIModal } from './components/CommanderAIModal';
import { BeginnerGlossaryModal } from './components/BeginnerGlossaryModal';
import { SafetyDrillHUD } from './components/SafetyDrillHUD';
import { FlameOpticsSection } from './components/FlameOpticsSection';
import {
  Flame,
  Info,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lightbulb,
  Radio,
  Globe2,
  Layers,
} from 'lucide-react';

export default function App() {
  // Atmosphere composition state (defaults to ISS Nominal)
  const [gases, setGases] = useState<Record<string, number>>({
    O2: 21,
    N2: 78,
    CO2: 0.4,
    Ar: 0.6,
    H2: 0,
    CH4: 0,
    C3H8: 0,
    C2H4: 0,
    SiH4: 0,
    NH3: 0,
    CO: 0,
    N2O: 0,
    Kr: 0,
    SF6: 0,
    He: 0,
    Novec: 0,
  });

  const [pressureKpa, setPressureKpa] = useState<number>(101.3);
  const [gravityG, setGravityG] = useState<number>(0.0); // 0-G Microgravity default
  const [ventilationSpeed, setVentilationSpeed] = useState<number>(0.15); // m/s
  const [selectedFuel, setSelectedFuel] = useState<FuelDefinition>(AVAILABLE_FUELS[0]);
  const [isIgnited, setIsIgnited] = useState<boolean>(true);
  const [currentPresetId, setCurrentPresetId] = useState<string>('iss_nominal');

  // Mode & Modal states
  const [isBeginnerMode, setIsBeginnerMode] = useState<boolean>(true); // Guest Mode by default
  const [rightPanelTab, setRightPanelTab] = useState<'hazard' | 'radar'>('hazard'); // SI Hazard Report by default
  const [presentationOpen, setPresentationOpen] = useState<boolean>(false);
  const [glossaryOpen, setGlossaryOpen] = useState<boolean>(false);
  const [commanderOpen, setCommanderOpen] = useState<boolean>(false);
  const [safetyDrillActive, setSafetyDrillActive] = useState<boolean>(false);
  const [visualizerSection, setVisualizerSection] = useState<'chamber' | 'flame'>('chamber');

  // SI Hazard Analysis Result State
  const [analysis, setAnalysis] = useState<SIAnalysisResult>({
    dangerLevel: 'HIGH',
    riskScore: 72,
    summarySimple:
      'In zero gravity, the spaceship air fans turn what would be a quiet blue sphere into an elongated, burning flame!',
    scientificInterpretation:
      'Microgravity diffusion flame sustained by forced convection (Re ~ 80). Quenching envelope remains active as long as ventilation supplies fresh O2.',
    flameBehavior:
      'Asymmetric blue sphere with trailing soot wake oriented along the forced airflow vector.',
    rankedHazards: [
      {
        title: 'Forced Air Convective Flame Spread',
        severity: 'HIGH',
        description: 'Spacecraft ventilation continuously renews oxygen delivery to the burning fuel surface.',
      },
      {
        title: 'Toxic CO & Fluoropolymer Decomposition',
        severity: 'HIGH',
        description: 'Wiring insulation pyrolysis produces toxic carbon monoxide and acid gases trapped in the module.',
      },
      {
        title: 'Smoke Detector Blindness',
        severity: 'MEDIUM',
        description: 'Smoke does not naturally rise to ceiling detectors without buoyancy, relying solely on air intake paths.',
      },
    ],
    astronautProtocol: [
      '1. Cut module ventilation fans immediately to stop feeding fresh oxygen.',
      '2. Don Emergency Breathing Apparatus (EBA) mask with positive pressure.',
      '3. Seal inter-module hatch to isolate atmospheric contamination.',
      '4. Discharge FK-5-1-12 clean agent extinguisher directly into the avionics rack.',
    ],
    historicalPrecedent:
      'Mir Space Station (1997): Oxygen generator fire burned in zero gravity, blocking evacuation routes and blinding the crew with smoke.',
    flameTempK: 1650,
    quenchRadiusMm: 2.2,
    flameRadiusCm: 2.8,
  });

  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);

  // Trigger SI Analysis
  const runAnalysis = useCallback(async () => {
    setIsLoadingAnalysis(true);
    try {
      const result = await analyzeFireSafetySI({
        gases,
        pressureKpa,
        gravityG,
        ventilationSpeed,
        fuelType: selectedFuel.name,
        isBeginnerMode,
      });
      setAnalysis(result);
    } catch (err) {
      console.error('Failed to run SI analysis:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  }, [gases, pressureKpa, gravityG, ventilationSpeed, selectedFuel, isBeginnerMode]);

  // Debounced auto-analysis when atmosphere shifts
  useEffect(() => {
    const timer = setTimeout(() => {
      runAnalysis();
    }, 600);
    return () => clearTimeout(timer);
  }, [gases, pressureKpa, gravityG, ventilationSpeed, selectedFuel.id]);

  // Handlers
  const handleGasChange = (gasId: string, val: number) => {
    setGases((prev) => ({
      ...prev,
      [gasId]: val,
    }));
    setCurrentPresetId('');
  };

  const handleCutVentilation = () => {
    setVentilationSpeed(0.0);
  };

  const handlePurgeChamber = () => {
    const purged: Record<string, number> = {};
    AVAILABLE_GASES.forEach((g) => (purged[g.id] = g.id === 'N2' ? 100 : 0));
    setGases(purged);
    setIsIgnited(false);
    setCurrentPresetId('');
  };

  const handleSelectPreset = (preset: AtmospherePreset) => {
    setCurrentPresetId(preset.id);
    setPressureKpa(preset.pressureKpa);
    setGravityG(preset.gravityG);
    setVentilationSpeed(preset.ventilationSpeed);

    const fuelMatch = AVAILABLE_FUELS.find((f) => f.id === preset.fuelType);
    if (fuelMatch) setSelectedFuel(fuelMatch);

    const newGases: Record<string, number> = {};
    AVAILABLE_GASES.forEach((g) => {
      newGases[g.id] = preset.gases[g.id] || 0;
    });
    setGases(newGases);
    setIsIgnited(true);
  };

  const handleApplyPresetScenario = (slideId: number) => {
    if (slideId === 1 || slideId === 2) {
      const iss = MISSION_PRESETS.find((p) => p.id === 'iss_nominal');
      if (iss) handleSelectPreset(iss);
    } else if (slideId === 3) {
      const apollo = MISSION_PRESETS.find((p) => p.id === 'apollo1_disaster');
      if (apollo) handleSelectPreset(apollo);
    } else if (slideId === 4) {
      // Hydrogen leak scenario
      setGases((prev) => ({ ...prev, H2: 25, O2: 25, N2: 50 }));
      setGravityG(0.0);
      setIsIgnited(true);
    } else if (slideId === 5) {
      const suppression = MISSION_PRESETS.find((p) => p.id === 'halon_suppression_test');
      if (suppression) handleSelectPreset(suppression);
    } else if (slideId === 6) {
      const artemis = MISSION_PRESETS.find((p) => p.id === 'artemis_gateway');
      if (artemis) handleSelectPreset(artemis);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 font-sans">
      {/* Top Aerospace Navbar */}
      <Navbar
        isBeginnerMode={isBeginnerMode}
        onToggleBeginnerMode={() => setIsBeginnerMode(!isBeginnerMode)}
        onOpenPresentation={() => setPresentationOpen(true)}
        onOpenGlossary={() => setGlossaryOpen(true)}
        onSelectPreset={handleSelectPreset}
        onStartSafetyDrill={() => setSafetyDrillActive(true)}
        isSafetyDrillActive={safetyDrillActive}
        currentPresetId={currentPresetId}
        totalGasesCount={AVAILABLE_GASES.length}
      />

      {/* Main Mission Control Console */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* Astronaut Emergency Safety Drill HUD (Docked above workspace when active) */}
        <SafetyDrillHUD
          isActive={safetyDrillActive}
          onClose={() => setSafetyDrillActive(false)}
          gases={gases}
          onGasChange={handleGasChange}
          pressureKpa={pressureKpa}
          onPressureChange={setPressureKpa}
          ventilationSpeed={ventilationSpeed}
          onVentilationChange={setVentilationSpeed}
          selectedFuel={selectedFuel}
          onFuelChange={setSelectedFuel}
          onPurgeN2={handlePurgeChamber}
          onCutFans={handleCutVentilation}
          onIgniteFlame={() => setIsIgnited(true)}
          allFuels={AVAILABLE_FUELS}
        />

        {/* Guest Mode Informational Callout Bar */}
        {isBeginnerMode && !safetyDrillActive && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/50 border border-cyan-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                <Globe2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-cyan-300 font-mono block sm:inline mr-2">
                  Guest Mode Active (Public & Students):
                </span>
                <span className="text-slate-300">
                  All space findings are translated into plain language! Test your reflexes in the emergency Safety Drill, test different gases in the candle combustion chamber, or launch the interactive presentation.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setSafetyDrillActive(true)}
                className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5 active:scale-95 border border-rose-500/60"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-200 animate-pulse" />
                Safety Drill
              </button>
              <button
                onClick={() => setPresentationOpen(true)}
                className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Guest Presentation
              </button>
              <button
                onClick={() => setGlossaryOpen(true)}
                className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
              >
                Space 101
              </button>
            </div>
          </div>
        )}

        {/* Crew Specialist Quick Drill Callout when beginner mode is off and drill is inactive */}
        {!isBeginnerMode && !safetyDrillActive && (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Astronaut Readiness Protocol: <strong>Randomized Atmosphere Emergency Scenarios</strong></span>
            </div>
            <button
              onClick={() => setSafetyDrillActive(true)}
              className="text-xs font-mono font-bold px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/50 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              Launch Safety Drill
            </button>
          </div>
        )}

        {/* Dashboard 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          {/* Left Column: Chamber Simulator with Candle & Multi-Gas Console (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Visualizer Section Switcher */}
            <div className="flex items-center justify-between p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setVisualizerSection('chamber')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    visualizerSection === 'chamber'
                      ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="text-sm">🕯️</span>
                  <span>Candle Chamber</span>
                </button>
                <button
                  onClick={() => setVisualizerSection('flame')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                    visualizerSection === 'flame'
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Flame Core & Spectroscopy</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                    FLAME SECTION
                  </span>
                </button>
              </div>

              <div className="hidden md:flex items-center gap-2 pr-2 text-[11px] font-mono text-slate-400">
                <span>Fuel: <strong className="text-white">{selectedFuel.name}</strong></span>
              </div>
            </div>

            {/* Active Visualizer Section */}
            {visualizerSection === 'chamber' ? (
              <ChamberCanvas
                gases={gases}
                pressureKpa={pressureKpa}
                gravityG={gravityG}
                ventilationSpeed={ventilationSpeed}
                fuel={selectedFuel}
                isIgnited={isIgnited}
                onToggleIgnite={() => setIsIgnited(!isIgnited)}
                onCutVentilation={handleCutVentilation}
                onPurgeChamber={handlePurgeChamber}
                isBeginnerMode={isBeginnerMode}
                flameTempK={analysis.flameTempK || 298}
                dangerLevel={analysis.dangerLevel}
              />
            ) : (
              <FlameOpticsSection
                gases={gases}
                pressureKpa={pressureKpa}
                gravityG={gravityG}
                ventilationSpeed={ventilationSpeed}
                fuel={selectedFuel}
                isIgnited={isIgnited}
                onToggleIgnite={() => setIsIgnited(!isIgnited)}
                flameTempK={analysis.flameTempK || 298}
                dangerLevel={analysis.dangerLevel}
              />
            )}

            {/* Gas Mixer & Environmental Injectors Panel */}
            <GasMixerPanel
              gases={gases}
              onGasChange={handleGasChange}
              pressureKpa={pressureKpa}
              onPressureChange={setPressureKpa}
              gravityG={gravityG}
              onGravityChange={setGravityG}
              ventilationSpeed={ventilationSpeed}
              onVentilationChange={setVentilationSpeed}
              selectedFuel={selectedFuel}
              onFuelChange={setSelectedFuel}
              isBeginnerMode={isBeginnerMode}
            />
          </div>

          {/* Right Column: Super Intelligence Hazard Analysis & Astronaut Protocol (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Tab switch between Hazard Report & 6-Axis Fire Safety Radar */}
            <div className="flex items-center justify-between p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
              <button
                onClick={() => setRightPanelTab('hazard')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                  rightPanelTab === 'hazard'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>SI Hazard Report</span>
              </button>
              <button
                onClick={() => setRightPanelTab('radar')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 ${
                  rightPanelTab === 'radar'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>6-Axis Safety Matrix</span>
              </button>
            </div>

            {/* Display either Hazard Matrix or Fire Safety Radar */}
            {rightPanelTab === 'hazard' ? (
              <HazardRankerDashboard
                analysis={analysis}
                isLoading={isLoadingAnalysis}
                onRefreshAnalysis={runAnalysis}
                isBeginnerMode={isBeginnerMode}
                onOpenCommander={() => setCommanderOpen(true)}
              />
            ) : (
              <FireSafetyRadar
                gases={gases}
                pressureKpa={pressureKpa}
                gravityG={gravityG}
                ventilationSpeed={ventilationSpeed}
                dangerLevel={analysis.dangerLevel}
                riskScore={analysis.riskScore}
                flameTempK={analysis.flameTempK || 298}
                quenchRadiusMm={analysis.quenchRadiusMm || 2.5}
                isGuestMode={isBeginnerMode}
              />
            )}

            {/* Quick Historical Spacecraft Mission Reference Cards */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  Iconic Space Missions Atmosphere Scenarios
                </span>
                <span className="text-[10px] font-mono text-slate-500">Click to Load</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MISSION_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      currentPresetId === preset.id
                        ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/30'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-white truncate max-w-[150px]">
                          {preset.name}
                        </span>
                        <span
                          className={`text-[8px] font-mono px-1 py-0.2 rounded border uppercase ${
                            preset.badgeType === 'danger'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : preset.badgeType === 'warning'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">
                        {isBeginnerMode ? preset.laypersonNote : preset.description}
                      </p>
                    </div>

                    <div className="mt-2 text-[9px] font-mono text-slate-500 flex items-center justify-between border-t border-slate-800/60 pt-1">
                      <span>{preset.pressureKpa} kPa</span>
                      <span>{preset.gravityG === 0 ? '0-G' : `${preset.gravityG}g`}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            NULL-G Spacecraft Fire Safety Super Intelligence • Grounded in NASA Saffire, BASS, and Apollo mission data
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <button onClick={() => setGlossaryOpen(true)} className="hover:text-cyan-400 transition-colors">
              Beginner Glossary
            </button>
            <button onClick={() => setPresentationOpen(true)} className="hover:text-cyan-400 transition-colors">
              Presentation Slides
            </button>
            <button onClick={() => setCommanderOpen(true)} className="hover:text-cyan-400 transition-colors">
              Ask Captain
            </button>
          </div>
        </div>
      </footer>

      {/* Presentation Masterclass Modal */}
      <PresentationModal
        isOpen={presentationOpen}
        onClose={() => setPresentationOpen(false)}
        onApplyPresetScenario={handleApplyPresetScenario}
        isBeginnerMode={isBeginnerMode}
      />

      {/* Interactive AI Commander Chat Modal */}
      <CommanderAIModal
        isOpen={commanderOpen}
        onClose={() => setCommanderOpen(false)}
        chamberState={{
          gases,
          pressureKpa,
          gravityG,
          ventilationSpeed,
          fuelType: selectedFuel.name,
        }}
        isBeginnerMode={isBeginnerMode}
      />

      {/* Beginner Glossary Modal */}
      <BeginnerGlossaryModal
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </div>
  );
}
