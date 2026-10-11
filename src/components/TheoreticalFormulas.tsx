import React from 'react';
import { CircuitParameters } from '../types/rectifier';
import { TOPOLOGY_METAS } from '../services/rectifierSimulation';
import { BookOpen, Check } from 'lucide-react';

interface TheoreticalFormulasProps {
  params: CircuitParameters;
}

export const TheoreticalFormulas: React.FC<TheoreticalFormulasProps> = ({ params }) => {
  const { topology, loadType, vsRms, alphaDeg } = params;
  const meta = TOPOLOGY_METAS[topology];

  const Vm = Math.sqrt(2) * vsRms;
  const alphaRad = (alphaDeg * Math.PI) / 180;
  const cosAlpha = Math.cos(alphaRad);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3.5 flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
        <BookOpen className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Governing Electrical Equations & Physics
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Box 1: Average DC Output Voltage */}
        <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="font-semibold text-slate-300 mb-1 flex items-center justify-between">
            <span>Average Output Voltage V_dc</span>
            <span className="text-[10px] font-mono text-cyan-400">{meta.pulseCount}-Pulse</span>
          </div>
          <div className="bg-slate-900 px-2.5 py-1.5 rounded font-mono text-cyan-300 text-sm my-1 border border-slate-800">
            {meta.theoreticalVdcFormula}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            For current continuous mode (CCM). When α &gt; 90°, average voltage becomes negative, allowing power flow back to the AC mains (inversion) if an active DC source is present.
          </p>
        </div>

        {/* Box 2: Load Differential Equation & Conduction */}
        <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80 flex flex-col justify-between">
          <div className="font-semibold text-slate-300 mb-1">
            Load Circuit Differential Equation
          </div>
          <div className="bg-slate-900 px-2.5 py-1.5 rounded font-mono text-amber-300 text-sm my-1 border border-slate-800">
            L · (di_o / dt) + R · i_o + E = v_o(t)
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            Analytical solution during conduction: <br />
            <code className="text-slate-300 font-mono text-[10px]">
              i_o(ωt) = (V_m/Z)·sin(ωt - φ) - E/R + A·e^(-ωt/tanφ)
            </code>
          </p>
        </div>

        {/* Box 3: Ripple Frequency & Harmonic Orders */}
        <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80">
          <div className="font-semibold text-slate-300 mb-1">
            Harmonic Orders & Ripple Frequency
          </div>
          <div className="text-[11px] text-slate-300 font-mono space-y-1">
            <div>
              • Ripple Fundamental: <strong className="text-cyan-400">{meta.pulseCount} · f = {meta.pulseCount * params.frequency} Hz</strong>
            </div>
            <div>
              • Dominant Harmonics: <span className="text-slate-400">{meta.pulseCount}k (k = 1, 2, 3...)</span>
            </div>
            <div>
              • Device Peak Inverse Voltage (PIV):{' '}
              <strong className="text-purple-400">
                {topology.startsWith('3P_') ? '√3 · V_m,ph' : (topology === '1P_MID_POINT' ? '2 · V_m' : 'V_m')}
              </strong>
            </div>
          </div>
        </div>

        {/* Box 4: Conduction Mode Criteria */}
        <div className="bg-slate-950/60 p-3 rounded border border-slate-800/80">
          <div className="font-semibold text-slate-300 mb-1">
            Continuous vs Discontinuous Conduction (CCM vs DCM)
          </div>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            {loadType === 'R' ? (
              <span>Pure resistive load operates discontinuously whenever α &gt; 0, since current is directly proportional to chopped instantaneous voltage.</span>
            ) : loadType === 'HIGH_L' ? (
              <span>Highly inductive load (L → ∞) guarantees ripple-free continuous DC current at all non-boundary firing angles.</span>
            ) : (
              <span>Current continuity depends on load angle <code className="text-cyan-300">φ = arctan(ωL/R)</code> relative to firing angle <code className="text-amber-300">α</code> and extinction angle <code className="text-emerald-300">β</code>. If β &lt; π + α, conduction is discontinuous (DCM).</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
