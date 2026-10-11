import React, { useState, useMemo } from 'react';
import { CircuitParameters, TopologyType } from '../types/rectifier';
import { simulateRectifier, TOPOLOGY_METAS } from '../services/rectifierSimulation';
import { X, ArrowRightLeft, Check } from 'lucide-react';

interface TopologyComparisonModalProps {
  baseParams: CircuitParameters;
  isOpen: boolean;
  onClose: () => void;
}

export const TopologyComparisonModal: React.FC<TopologyComparisonModalProps> = ({
  baseParams,
  isOpen,
  onClose,
}) => {
  const [altTopology, setAltTopology] = useState<TopologyType>(
    baseParams.topology === '1P_FULL_BRIDGE' ? '1P_SEMI_CONVERTER' : '1P_FULL_BRIDGE'
  );
  const [altAlphaDeg, setAltAlphaDeg] = useState<number>(baseParams.alphaDeg);

  // Run simulation for both
  const sim1 = useMemo(() => simulateRectifier(baseParams), [baseParams]);
  const sim2 = useMemo(
    () =>
      simulateRectifier({
        ...baseParams,
        topology: altTopology,
        alphaDeg: altAlphaDeg,
      }),
    [baseParams, altTopology, altAlphaDeg]
  );

  if (!isOpen) return null;

  const meta1 = TOPOLOGY_METAS[baseParams.topology];
  const meta2 = TOPOLOGY_METAS[altTopology];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-100">
              Topology & Firing Angle Comparative Matrix
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Controls for Config 2 */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Compare against:</span>
              <select
                value={altTopology}
                onChange={(e) => setAltTopology(e.target.value as TopologyType)}
                className="bg-slate-900 border border-slate-700 text-xs font-mono rounded px-2.5 py-1 text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                {Object.values(TOPOLOGY_METAS).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Firing Angle (α₂):</span>
              <input
                type="range"
                min="0"
                max="180"
                value={altAlphaDeg}
                onChange={(e) => setAltAlphaDeg(Number(e.target.value))}
                className="w-28 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-amber-400 min-w-8">
                {altAlphaDeg}°
              </span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                  <th className="text-left py-2.5 px-4 font-semibold">Parameter / Metric</th>
                  <th className="text-right py-2.5 px-4 font-semibold text-cyan-400">
                    Configuration 1 (Active)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold text-amber-400">
                    Configuration 2 (Reference)
                  </th>
                  <th className="text-right py-2.5 px-4 font-semibold text-slate-300">Delta (Δ)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 text-slate-200">
                <tr>
                  <td className="py-2 px-4 text-slate-400">Topology</td>
                  <td className="py-2 px-4 text-right font-sans font-medium text-cyan-300">
                    {meta1.name}
                  </td>
                  <td className="py-2 px-4 text-right font-sans font-medium text-amber-300">
                    {meta2.name}
                  </td>
                  <td className="py-2 px-4 text-right text-slate-500">—</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Firing Angle (α)</td>
                  <td className="py-2 px-4 text-right tabular-nums text-cyan-300 font-bold">
                    {baseParams.alphaDeg}°
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-amber-300 font-bold">
                    {altAlphaDeg}°
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {altAlphaDeg - baseParams.alphaDeg > 0 ? '+' : ''}
                    {altAlphaDeg - baseParams.alphaDeg}°
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Average Output Voltage (V_dc)</td>
                  <td className="py-2 px-4 text-right tabular-nums text-cyan-300 font-bold">
                    {sim1.metrics.vdc} V
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-amber-300 font-bold">
                    {sim2.metrics.vdc} V
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.vdc - sim1.metrics.vdc).toFixed(2)} V
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Average Output Current (I_dc)</td>
                  <td className="py-2 px-4 text-right tabular-nums text-cyan-300">
                    {sim1.metrics.idc} A
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-amber-300">
                    {sim2.metrics.idc} A
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.idc - sim1.metrics.idc).toFixed(2)} A
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">RMS Output Voltage (V_orms)</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim1.metrics.vorms} V</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim2.metrics.vorms} V</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.vorms - sim1.metrics.vorms).toFixed(2)} V
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Ripple Factor (RF)</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim1.metrics.rippleFactor}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim2.metrics.rippleFactor}</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.rippleFactor - sim1.metrics.rippleFactor).toFixed(3)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Input Power Factor</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim1.metrics.powerFactor}</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim2.metrics.powerFactor}</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.powerFactor - sim1.metrics.powerFactor).toFixed(3)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Input Current THD</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim1.metrics.thdCurrent}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">{sim2.metrics.thdCurrent}%</td>
                  <td className="py-2 px-4 text-right tabular-nums">
                    {(sim2.metrics.thdCurrent - sim1.metrics.thdCurrent).toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-4 text-slate-400">Conduction Mode</td>
                  <td className="py-2 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        sim1.metrics.conductionMode === 'CCM'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {sim1.metrics.conductionMode}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        sim2.metrics.conductionMode === 'CCM'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {sim2.metrics.conductionMode}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right text-slate-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 bg-slate-950 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
