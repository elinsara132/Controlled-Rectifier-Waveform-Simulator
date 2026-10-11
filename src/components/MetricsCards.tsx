import React from 'react';
import { SimulationMetrics, TopologyType } from '../types/rectifier';
import { Activity, Gauge, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MetricsCardsProps {
  metrics: SimulationMetrics;
  topology: TopologyType;
  alphaDeg: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  metrics,
  topology,
  alphaDeg,
}) => {
  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
      {/* 1. DC Average Output Voltage */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Average Voltage (V_dc)
          </span>
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
            {metrics.vdc}
            <span className="text-xs text-slate-500 font-normal ml-1">V</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate">
          V_orms: {metrics.vorms} V
        </div>
      </div>

      {/* 2. DC Average Output Current */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Average Current (I_dc)
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {metrics.idc}
            <span className="text-xs text-slate-500 font-normal ml-1">A</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate">
          I_orms: {metrics.iorms} A
        </div>
      </div>

      {/* 3. Ripple Factor & Form Factor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Ripple Factor (RF)
          </span>
          <Gauge className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {metrics.rippleFactor}
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate">
          Form Factor: {metrics.formFactor}
        </div>
      </div>

      {/* 4. Conduction Mode & Extinction Angle */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Conduction Mode
          </span>
          {metrics.conductionMode === 'CCM' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
        </div>
        <div className="my-1.5 flex items-baseline gap-2">
          <div
            className={`text-xl font-bold font-mono tabular-nums ${
              metrics.conductionMode === 'CCM' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {metrics.conductionMode}
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {metrics.conductionMode === 'CCM' ? 'Continuous' : 'Discontinuous'}
          </span>
        </div>
        <div className="text-[10px] font-mono text-slate-400 truncate">
          Extinction β: {metrics.extinctionAngleDeg}° (γ={metrics.conductionAngleDeg}°)
        </div>
      </div>

      {/* 5. Power Quality & Power Factor */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Input Power Factor
          </span>
          <Zap className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-sky-300 tabular-nums">
            {metrics.powerFactor}
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-500 truncate">
          Displacement cos(α): {metrics.displacementFactor}
        </div>
      </div>

      {/* 6. Rectifier Power & Efficiency */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            DC Power & Efficiency
          </span>
          <Activity className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono text-purple-300 tabular-nums">
            {metrics.pdc}
            <span className="text-xs text-slate-500 font-normal ml-1">W</span>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 truncate">
          η = {metrics.efficiency}% · PIV = {metrics.pivDevice}V
        </div>
      </div>
    </div>
  );
};
