import React from 'react';
import { CircuitParameters, LoadType, TopologyType } from '../types/rectifier';
import { TOPOLOGY_METAS } from '../services/rectifierSimulation';
import { CIRCUIT_PRESETS } from '../data/presets';
import {
  Zap,
  Activity,
  Sliders,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';

interface ParametersPanelProps {
  params: CircuitParameters;
  onChange: (newParams: CircuitParameters) => void;
  onSelectPreset: (presetId: string) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  params,
  onChange,
  onSelectPreset,
}) => {
  const update = <K extends keyof CircuitParameters>(key: K, value: CircuitParameters[K]) => {
    onChange({ ...params, [key]: value });
  };

  const omega = 2 * Math.PI * params.frequency;
  const loadImpedanceZ = Math.sqrt(
    params.resistance * params.resistance +
      Math.pow(omega * (params.inductanceMh * 1e-3), 2)
  );
  const loadAngleDeg =
    (Math.atan2(omega * (params.inductanceMh * 1e-3), params.resistance) * 180) /
    Math.PI;
  const timeConstantMs =
    params.resistance > 0
      ? ((params.inductanceMh * 1e-3) / params.resistance) * 1000
      : 0;

  const activeMeta = TOPOLOGY_METAS[params.topology];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 1. Topology Selection Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Rectifier Bridge Topology
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            {activeMeta.switches}
          </span>
        </div>

        {/* 1-Phase vs 3-Phase Grouped Selector */}
        <div className="space-y-2">
          {/* 1-Phase Section */}
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
              Single-Phase Topologies
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: '1P_FULL_BRIDGE', label: '1Φ Full Bridge (4 SCR)' },
                { id: '1P_SEMI_CONVERTER', label: '1Φ Semi-Converter' },
                { id: '1P_HALF_WAVE', label: '1Φ Half-Wave' },
                { id: '1P_MID_POINT', label: '1Φ Mid-Point' },
                { id: '1P_DIODE_BRIDGE', label: '1Φ Diode Bridge' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => update('topology', item.id as TopologyType)}
                  className={`px-2 py-1.5 text-xs text-left font-mono rounded border transition-colors ${
                    params.topology === item.id
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Phase Section */}
          <div className="pt-1.5 border-t border-slate-800/60">
            <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">
              Three-Phase Topologies
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { id: '3P_FULL_BRIDGE', label: '3Φ Graetz (6 SCR)' },
                { id: '3P_SEMI_CONVERTER', label: '3Φ Semi-Bridge' },
                { id: '3P_HALF_WAVE', label: '3Φ Half-Wave' },
                { id: '3P_DIODE_BRIDGE', label: '3Φ 6-Diode Bridge' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => update('topology', item.id as TopologyType)}
                  className={`px-2 py-1.5 text-xs text-left font-mono rounded border transition-colors ${
                    params.topology === item.id
                      ? 'bg-cyan-950/70 text-cyan-300 border-cyan-500 font-semibold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Topology Quick Description */}
        <p className="text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80 leading-relaxed">
          {activeMeta.shortDesc}
        </p>
      </div>

      {/* 2. Firing Angle (alpha) Control - The Main Instrument Slider */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              SCR Firing Angle (α)
            </h3>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-2xl font-bold text-amber-400 tabular-nums">
              {params.alphaDeg}°
            </span>
            <span className="text-xs text-slate-500">
              ({((params.alphaDeg * Math.PI) / 180).toFixed(2)} rad)
            </span>
          </div>
        </div>

        {/* Alpha Slider with Visual Marks */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={params.alphaDeg}
            onChange={(e) => update('alphaDeg', Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>0° (Diode)</span>
            <span>30°</span>
            <span>60°</span>
            <span>90° (Boundary)</span>
            <span>120°</span>
            <span>150°</span>
            <span>180°</span>
          </div>
        </div>

        {/* Quick Angle Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-800/60">
          <span className="text-[11px] font-mono text-slate-500 mr-1">Presets:</span>
          {[0, 15, 30, 45, 60, 90, 120, 150].map((deg) => (
            <button
              key={deg}
              onClick={() => update('alphaDeg', deg)}
              className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                params.alphaDeg === deg
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-semibold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {deg}°
            </button>
          ))}
          <div className="ml-auto text-[11px] font-mono">
            {params.alphaDeg > 90 ? (
              <span className="text-rose-400 font-semibold">
                ▲ Inverter Mode (Active E Load Required)
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                ● Rectification Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Load Conditions & Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Load Conditions
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Z = {loadImpedanceZ.toFixed(2)} Ω · φ = {loadAngleDeg.toFixed(1)}°
          </span>
        </div>

        {/* Load Type Selector */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-3.5">
          {[
            { id: 'R', label: 'R (Resistive)' },
            { id: 'RL', label: 'R-L (Inductive)' },
            { id: 'RL_FWD', label: 'R-L + Diode' },
            { id: 'RLE', label: 'R-L-E (DC Motor)' },
            { id: 'HIGH_L', label: 'L → ∞ (Ideal)' },
            { id: 'RC', label: 'R-C (Filter)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => update('loadType', item.id as LoadType)}
              className={`px-1.5 py-1 text-xs text-center font-mono rounded border transition-colors ${
                params.loadType === item.id
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500 font-semibold shadow-sm'
                  : 'bg-slate-950/50 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Numeric Sliders for Load Component Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Resistance R */}
          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Resistance (R):</span>
              <strong className="text-cyan-400">{params.resistance} Ω</strong>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={params.resistance}
              onChange={(e) => update('resistance', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Inductance L */}
          {(params.loadType === 'RL' ||
            params.loadType === 'RL_FWD' ||
            params.loadType === 'RLE') && (
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Inductance (L):</span>
                <strong className="text-purple-400">{params.inductanceMh} mH</strong>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={params.inductanceMh}
                onChange={(e) => update('inductanceMh', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-purple-400"
              />
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                τ = L/R = {timeConstantMs.toFixed(2)} ms
              </div>
            </div>
          )}

          {/* DC Back-EMF / Battery E */}
          {params.loadType === 'RLE' && (
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Back-EMF / Battery (E):</span>
                <strong className="text-rose-400">{params.backEmf} V</strong>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="2"
                value={params.backEmf}
                onChange={(e) => update('backEmf', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-rose-400"
              />
            </div>
          )}

          {/* Capacitance C (for RC load) */}
          {params.loadType === 'RC' && (
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Capacitance (C):</span>
                <strong className="text-emerald-400">{params.capacitanceUf} μF</strong>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                step="10"
                value={params.capacitanceUf}
                onChange={(e) => update('capacitanceUf', Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                RC Time = {((params.resistance * params.capacitanceUf) / 1000).toFixed(1)} ms
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. AC Supply Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              AC Supply Parameters
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Peak V_m = {(Math.sqrt(2) * params.vsRms).toFixed(1)} V
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Supply Voltage Vs */}
          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>AC Voltage (RMS):</span>
              <strong className="text-sky-400">{params.vsRms} V</strong>
            </div>
            <input
              type="range"
              min="24"
              max="480"
              step="4"
              value={params.vsRms}
              onChange={(e) => update('vsRms', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex gap-2 mt-1.5">
              {[120, 230, 400, 480].map((v) => (
                <button
                  key={v}
                  onClick={() => update('vsRms', v)}
                  className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                    params.vsRms === v
                      ? 'bg-sky-950 text-sky-300 border-sky-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {v}V
                </button>
              ))}
            </div>
          </div>

          {/* Line Frequency */}
          <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Line Frequency (f):</span>
              <strong className="text-sky-400">{params.frequency} Hz</strong>
            </div>
            <input
              type="range"
              min="10"
              max="400"
              step="5"
              value={params.frequency}
              onChange={(e) => update('frequency', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex gap-2 mt-1.5">
              {[50, 60, 400].map((fVal) => (
                <button
                  key={fVal}
                  onClick={() => update('frequency', fVal)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded border ${
                    params.frequency === fVal
                      ? 'bg-sky-950 text-sky-300 border-sky-600'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  {fVal}Hz {fVal === 400 ? '(Aviation)' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Preset Configurations Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Application Benchmarks & Presets</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {CIRCUIT_PRESETS.slice(0, 8).map((preset) => (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className="px-2 py-1.5 text-left bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 rounded text-xs transition-colors group"
            >
              <div className="font-semibold text-slate-200 group-hover:text-cyan-300 truncate">
                {preset.name.split('·')[0]}
              </div>
              <div className="text-[10px] text-slate-400 truncate font-mono">
                {preset.category}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
