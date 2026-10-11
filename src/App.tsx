import React, { useState, useMemo, useCallback } from 'react';
import { CircuitParameters } from './types/rectifier';
import { simulateRectifier } from './services/rectifierSimulation';
import { CIRCUIT_PRESETS } from './data/presets';
import { Header } from './components/Header';
import { ParametersPanel } from './components/ParametersPanel';
import { WaveformOscilloscope } from './components/WaveformOscilloscope';
import { CircuitSchematic } from './components/CircuitSchematic';
import { MetricsCards } from './components/MetricsCards';
import { HarmonicsChart } from './components/HarmonicsChart';
import { TheoreticalFormulas } from './components/TheoreticalFormulas';
import { TopologyComparisonModal } from './components/TopologyComparisonModal';

export default function App() {
  // Primary Circuit Simulation Parameters State
  const [params, setParams] = useState<CircuitParameters>({
    topology: '1P_FULL_BRIDGE',
    loadType: 'RL',
    vsRms: 230,
    frequency: 50,
    alphaDeg: 45,
    resistance: 10,
    inductanceMh: 50,
    backEmf: 0,
    capacitanceUf: 100,
    sourceInductanceUh: 0,
  });

  // Active Device Conduction state passed from Oscilloscope to Schematic
  const [activeDeviceState, setActiveDeviceState] = useState<string>('T1, T2');

  // Navigation view mode ('all' | 'scope' | 'schematic' | 'theory')
  const [activeView, setActiveView] = useState<'all' | 'scope' | 'schematic' | 'theory'>('all');

  // Comparison modal state
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Run Real-time Simulation
  const { points, metrics } = useMemo(() => {
    return simulateRectifier(params);
  }, [params]);

  // Handle Preset Selection
  const handleSelectPreset = useCallback((presetId: string) => {
    const found = CIRCUIT_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setParams(found.params);
    }
  }, []);

  // Handle Oscilloscope Hover Time updates
  const handleHoverTimeChange = useCallback((_timeMs: number | null, state: string) => {
    if (state) {
      setActiveDeviceState(state);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Bar Header */}
      <Header
        onOpenCompare={() => setIsCompareOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Main Simulation Workspace */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-4 lg:p-6 space-y-4">
        {/* Top Level Telemetry Metrics Ribbon */}
        <MetricsCards
          metrics={metrics}
          topology={params.topology}
          alphaDeg={params.alphaDeg}
        />

        {/* Primary Two-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left Column: Interactive Parameters Deck (5 cols on large screens) */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
            <ParametersPanel
              params={params}
              onChange={setParams}
              onSelectPreset={handleSelectPreset}
            />

            {/* Circuit Schematic (Desktop view under parameters) */}
            {(activeView === 'all' || activeView === 'schematic') && (
              <CircuitSchematic
                params={params}
                activeDeviceState={activeDeviceState}
              />
            )}
          </div>

          {/* Right Column: Oscilloscope Waveforms & Deep Analysis (8 cols) */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-4">
            {/* Multi-channel Oscilloscope Display */}
            {(activeView === 'all' || activeView === 'scope') && (
              <WaveformOscilloscope
                points={points}
                metrics={metrics}
                frequency={params.frequency}
                alphaDeg={params.alphaDeg}
                onHoverTimeChange={handleHoverTimeChange}
              />
            )}

            {/* Harmonics Spectrum Chart */}
            {(activeView === 'all' || activeView === 'scope') && (
              <HarmonicsChart
                harmonics={metrics.harmonics}
                metrics={metrics}
                lineFreq={params.frequency}
              />
            )}

            {/* Theoretical Physics & Governing Equations Card */}
            {(activeView === 'all' || activeView === 'theory') && (
              <TheoreticalFormulas params={params} />
            )}
          </div>
        </div>
      </main>

      {/* Dual Topology Comparison Modal */}
      <TopologyComparisonModal
        baseParams={params}
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
      />

      {/* Engineering Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800/80 px-6 py-3 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 font-mono">
        <div>
          RectiSim · Power Electronics Controlled Rectifier Laboratory
        </div>
        <div className="flex items-center gap-4">
          <span>Continuous Numerical Time-Step ODE Solver</span>
          <span>·</span>
          <span>Sampling: 1,000 steps/cycle</span>
        </div>
      </footer>
    </div>
  );
}
