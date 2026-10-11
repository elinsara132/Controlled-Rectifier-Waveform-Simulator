import React from 'react';
import { HarmonicComponent, SimulationMetrics } from '../types/rectifier';
import { BarChart3 } from 'lucide-react';

interface HarmonicsChartProps {
  harmonics: HarmonicComponent[];
  metrics: SimulationMetrics;
  lineFreq: number;
}

export const HarmonicsChart: React.FC<HarmonicsChartProps> = ({
  harmonics,
  metrics,
  lineFreq,
}) => {
  // Find highest AC harmonic for scaling
  const acHarmonics = harmonics.filter((h) => h.order > 0);
  const maxAcAmp = acHarmonics.reduce((max, h) => Math.max(max, h.amplitude), 10);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3.5">
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Harmonic Spectrum Analysis (FFT)
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            Current THD: <strong className="text-amber-400">{metrics.thdCurrent}%</strong>
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">
            DC Component: <strong className="text-cyan-300">{metrics.vdc} V</strong>
          </span>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="w-full h-36 flex items-end gap-2 pt-2 pb-1 px-2 bg-slate-950/60 rounded border border-slate-800/60">
        {harmonics.map((h) => {
          const isDc = h.order === 0;
          // Scale height: DC gets fixed 90%, AC harmonics scale to maxAcAmp
          const heightPct = isDc
            ? 90
            : Math.min(85, Math.max(4, (h.amplitude / (maxAcAmp * 1.1)) * 80));

          return (
            <div
              key={h.order}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                {isDc ? 'DC Component' : `n=${h.order} (${h.frequencyHz} Hz)`}
                <div className="text-cyan-300 font-bold">{h.amplitude} V ({h.percentageOfDc}%)</div>
              </div>

              {/* Numerical label on top of bar */}
              <span className="text-[9px] font-mono text-slate-400 mb-1 opacity-80 group-hover:opacity-100 tabular-nums">
                {h.amplitude}V
              </span>

              {/* Bar element */}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full max-w-[28px] rounded-t transition-all ${
                  isDc
                    ? 'bg-cyan-500 hover:bg-cyan-400'
                    : h.order % 6 === 0
                    ? 'bg-purple-500 hover:bg-purple-400'
                    : 'bg-amber-500 hover:bg-amber-400'
                }`}
              />

              {/* Bottom label: harmonic order */}
              <span className="text-[10px] font-mono text-slate-400 mt-1 font-medium">
                {isDc ? 'DC' : `${h.order}f`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2">
        <span>Harmonic Order (f = {lineFreq} Hz fundamental)</span>
        <span>DC component = 100% reference level</span>
      </div>
    </div>
  );
};
