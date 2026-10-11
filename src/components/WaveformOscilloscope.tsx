import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { WaveformPoint, SimulationMetrics } from '../types/rectifier';
import {
  Download,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Crosshair,
  Maximize2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface WaveformOscilloscopeProps {
  points: WaveformPoint[];
  metrics: SimulationMetrics;
  frequency: number;
  alphaDeg: number;
  onHoverTimeChange?: (timeMs: number | null, state: string) => void;
}

export const WaveformOscilloscope: React.FC<WaveformOscilloscopeProps> = ({
  points,
  metrics,
  frequency,
  alphaDeg,
  onHoverTimeChange,
}) => {
  // Channel visibility toggles
  const [showVo, setShowVo] = useState<boolean>(true);
  const [showIo, setShowIo] = useState<boolean>(true);
  const [showVs, setShowVs] = useState<boolean>(true);
  const [showIs, setShowIs] = useState<boolean>(false);
  const [showVDevice, setShowVDevice] = useState<boolean>(false);
  const [showPo, setShowPo] = useState<boolean>(false);
  const [showGate, setShowGate] = useState<boolean>(true);
  const [showAverageLines, setShowAverageLines] = useState<boolean>(true);

  // Time & Display settings
  const [displayCycles, setDisplayCycles] = useState<1 | 2>(2);
  const [isLiveSweeping, setIsLiveSweeping] = useState<boolean>(true);
  const [sweepProgress, setSweepProgress] = useState<number>(0);

  // Measurement Cursors
  const [enableCursors, setEnableCursors] = useState<boolean>(false);
  const [cursorAPct, setCursorAPct] = useState<number>(0.25);
  const [cursorBPct, setCursorBPct] = useState<number>(0.75);
  const [activeCursorDrag, setActiveCursorDrag] = useState<'A' | 'B' | null>(null);

  // Hover state
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  // Filter points based on cycle setting
  const cyclePeriodMs = (1 / frequency) * 1000;
  const maxTimeMs = displayCycles * cyclePeriodMs;
  const visiblePoints = useMemo(() => {
    return points.filter((p) => p.t <= maxTimeMs + 0.05);
  }, [points, maxTimeMs]);

  // Compute dynamic scale ranges for multi-channel autoscale
  const scales = useMemo(() => {
    let maxV = 10;
    let minV = -10;
    let maxI = 1;
    let minI = 0;
    let maxP = 10;

    for (const p of visiblePoints) {
      if (p.vo > maxV) maxV = p.vo;
      if (p.vo < minV) minV = p.vo;
      if (p.vs > maxV) maxV = p.vs;
      if (p.vs < minV) minV = p.vs;
      if (p.vDevice > maxV) maxV = p.vDevice;
      if (p.vDevice < minV) minV = p.vDevice;

      if (p.io > maxI) maxI = p.io;
      if (p.io < minI) minI = p.io;
      if (p.is > maxI) maxI = p.is;
      if (p.is < minI) minI = p.is;

      if (p.po > maxP) maxP = p.po;
    }

    // Add 12% headroom
    const vSpan = Math.max(20, maxV - minV);
    const vMargin = vSpan * 0.12;
    const vUpper = maxV + vMargin;
    const vLower = minV - vMargin;

    const iSpan = Math.max(1, maxI - minI);
    const iMargin = iSpan * 0.15;
    const iUpper = maxI + iMargin;
    const iLower = Math.min(0, minI - iMargin);

    const pUpper = maxP * 1.2;

    return {
      vUpper,
      vLower,
      iUpper,
      iLower,
      pUpper,
      tMax: maxTimeMs,
    };
  }, [visiblePoints, maxTimeMs]);

  // Live sweep animation loop (oscilloscope beam scan)
  useEffect(() => {
    if (!isLiveSweeping) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    const sweepDuration = 2500; // ms for full sweep across screen

    const sweepLoop = (time: number) => {
      const delta = time - lastTimestamp;
      lastTimestamp = time;
      setSweepProgress((prev) => (prev + delta / sweepDuration) % 1);
      animRef.current = requestAnimationFrame(sweepLoop);
    };

    animRef.current = requestAnimationFrame(sweepLoop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isLiveSweeping]);

  // Sync active hover or sweep point with parent schematic
  useEffect(() => {
    if (!onHoverTimeChange || visiblePoints.length === 0) return;

    if (hoverIndex !== null && visiblePoints[hoverIndex]) {
      const pt = visiblePoints[hoverIndex];
      onHoverTimeChange(pt.t, pt.conductingState);
    } else if (isLiveSweeping) {
      const sweepIdx = Math.min(
        visiblePoints.length - 1,
        Math.floor(sweepProgress * visiblePoints.length)
      );
      const pt = visiblePoints[sweepIdx];
      if (pt) {
        onHoverTimeChange(pt.t, pt.conductingState);
      }
    }
  }, [hoverIndex, sweepProgress, isLiveSweeping, visiblePoints, onHoverTimeChange]);

  // Mouse interaction on the waveform canvas
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || visiblePoints.length === 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

      if (activeCursorDrag === 'A') {
        setCursorAPct(relX);
        return;
      }
      if (activeCursorDrag === 'B') {
        setCursorBPct(relX);
        return;
      }

      const index = Math.min(
        visiblePoints.length - 1,
        Math.floor(relX * visiblePoints.length)
      );
      setHoverIndex(index);
    },
    [visiblePoints, activeCursorDrag]
  );

  const handleMouseLeave = useCallback(() => {
    if (!activeCursorDrag) {
      setHoverIndex(null);
      if (onHoverTimeChange) onHoverTimeChange(null, 'Nominal');
    }
  }, [activeCursorDrag, onHoverTimeChange]);

  const handleMouseUp = useCallback(() => {
    setActiveCursorDrag(null);
  }, []);

  // SVG dimensions
  const svgWidth = 1000;
  const svgHeight = 440;
  const padLeft = 65;
  const padRight = 65;
  const padTop = 30;
  const padBottom = 45;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  // Coordinate transform functions
  const getX = (tMs: number) => {
    return padLeft + (tMs / scales.tMax) * plotWidth;
  };

  const getYV = (v: number) => {
    const norm = (v - scales.vLower) / (scales.vUpper - scales.vLower || 1);
    return padTop + plotHeight * (1 - norm);
  };

  const getYI = (i: number) => {
    const norm = (i - scales.iLower) / (scales.iUpper - scales.iLower || 1);
    return padTop + plotHeight * (1 - norm);
  };

  const getZeroYV = getYV(0);
  const getZeroYI = getYI(0);

  // Generate SVG path string from points
  const makePath = (getYVal: (p: WaveformPoint) => number) => {
    if (visiblePoints.length === 0) return '';
    let d = `M ${getX(visiblePoints[0].t).toFixed(1)} ${getYVal(visiblePoints[0]).toFixed(1)}`;
    for (let i = 1; i < visiblePoints.length; i++) {
      d += ` L ${getX(visiblePoints[i].t).toFixed(1)} ${getYVal(visiblePoints[i]).toFixed(1)}`;
    }
    return d;
  };

  // Paths for each channel
  const pathVo = useMemo(() => makePath((p) => getYV(p.vo)), [visiblePoints, scales]);
  const pathVs = useMemo(() => makePath((p) => getYV(p.vs)), [visiblePoints, scales]);
  const pathVsB = useMemo(
    () => (visiblePoints[0]?.vsB !== undefined ? makePath((p) => getYV(p.vsB ?? 0)) : ''),
    [visiblePoints, scales]
  );
  const pathVsC = useMemo(
    () => (visiblePoints[0]?.vsC !== undefined ? makePath((p) => getYV(p.vsC ?? 0)) : ''),
    [visiblePoints, scales]
  );
  const pathIo = useMemo(() => makePath((p) => getYI(p.io)), [visiblePoints, scales]);
  const pathIs = useMemo(() => makePath((p) => getYI(p.is)), [visiblePoints, scales]);
  const pathVDevice = useMemo(() => makePath((p) => getYV(p.vDevice)), [visiblePoints, scales]);
  const pathPo = useMemo(
    () =>
      makePath((p) => {
        const norm = Math.max(0, p.po) / (scales.pUpper || 1);
        return padTop + plotHeight * (1 - norm);
      }),
    [visiblePoints, scales]
  );

  // Current probe at hover
  const hoverPoint = hoverIndex !== null ? visiblePoints[hoverIndex] : null;

  // Cursor measurements
  const cursorAPt = visiblePoints[Math.min(visiblePoints.length - 1, Math.floor(cursorAPct * visiblePoints.length))] || visiblePoints[0];
  const cursorBPt = visiblePoints[Math.min(visiblePoints.length - 1, Math.floor(cursorBPct * visiblePoints.length))] || visiblePoints[visiblePoints.length - 1];
  const deltaT = cursorAPt && cursorBPt ? Math.abs(cursorBPt.t - cursorAPt.t) : 0;
  const deltaDeg = (deltaT / (cyclePeriodMs || 1)) * 360;
  const deltaFreq = deltaT > 0 ? (1000 / deltaT).toFixed(1) : '---';
  const deltaVo = cursorAPt && cursorBPt ? Number((cursorBPt.vo - cursorAPt.vo).toFixed(1)) : 0;
  const deltaIo = cursorAPt && cursorBPt ? Number((cursorBPt.io - cursorAPt.io).toFixed(2)) : 0;

  // Export CSV
  const handleExportCsv = () => {
    let csv = 'Time_ms,Angle_deg,Supply_Vs,Load_Vo,Load_Io,Supply_Is,Thyristor_V1,Power_Po,Gate_Pulse,Conducting_State\n';
    for (const p of visiblePoints) {
      csv += `${p.t},${p.omegaTDeg},${p.vs},${p.vo},${p.io},${p.is},${p.vDevice},${p.po},${p.gatePulse},"${p.conductingState}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `rectifier_waveforms_alpha${alphaDeg}deg.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="w-full bg-slate-900 border border-slate-800 rounded-lg flex flex-col shadow-xl overflow-hidden"
      onMouseUp={handleMouseUp}
    >
      {/* Scope Top Header & Quick Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-950 border-b border-slate-800 text-xs">
        {/* Scope Identification & Timebase */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="tracking-wide">OSCILLOSCOPE VIEW</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 font-mono">
            Timebase: <strong className="text-slate-200">{((cyclePeriodMs * displayCycles) / 10).toFixed(2)} ms/div</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 font-mono">
            Line: <strong className="text-cyan-400">{frequency} Hz</strong> (T = {cyclePeriodMs.toFixed(1)}ms)
          </span>
        </div>

        {/* Oscilloscope Primary Toolbar */}
        <div className="flex items-center gap-2">
          {/* Cursors Toggle */}
          <button
            onClick={() => setEnableCursors(!enableCursors)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              enableCursors
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
            title="Toggle Precision Dual Cursors (Cursor A & Cursor B)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Cursors</span>
          </button>

          {/* Sweep / Pause */}
          <button
            onClick={() => setIsLiveSweeping(!isLiveSweeping)}
            className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
              isLiveSweeping
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60'
            }`}
            title={isLiveSweeping ? 'Pause Live Sweep' : 'Resume Live Sweep'}
          >
            {isLiveSweeping ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isLiveSweeping ? 'Sweep' : 'Frozen'}</span>
          </button>

          {/* Cycle count selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setDisplayCycles(1)}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                displayCycles === 1 ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              1 Cycle
            </button>
            <button
              onClick={() => setDisplayCycles(2)}
              className={`px-2 py-0.5 text-xs font-mono rounded ${
                displayCycles === 2 ? 'bg-cyan-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2 Cycles
            </button>
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 transition-colors"
            title="Export High-Resolution Waveform Data as CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Channel Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold mr-1">
            Channels:
          </span>

          {/* CH1: Load Voltage Vo */}
          <button
            onClick={() => setShowVo(!showVo)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showVo
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>CH1: Load v_o(t)</span>
          </button>

          {/* CH2: Load Current Io */}
          <button
            onClick={() => setShowIo(!showIo)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showIo
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>CH2: Load i_o(t)</span>
          </button>

          {/* CH3: Source Voltage Vs */}
          <button
            onClick={() => setShowVs(!showVs)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showVs
                ? 'bg-sky-950/60 text-sky-300 border-sky-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>CH3: Supply v_s(t)</span>
          </button>

          {/* CH4: Source Current Is */}
          <button
            onClick={() => setShowIs(!showIs)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showIs
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>CH4: Supply i_s(t)</span>
          </button>

          {/* CH5: Thyristor Voltage vT */}
          <button
            onClick={() => setShowVDevice(!showVDevice)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showVDevice
                ? 'bg-purple-950/60 text-purple-300 border-purple-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>CH5: Thyristor v_T1(t)</span>
          </button>

          {/* CH6: Power Po */}
          <button
            onClick={() => setShowPo(!showPo)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showPo
                ? 'bg-rose-950/60 text-rose-300 border-rose-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            <span>CH6: Power p_o(t)</span>
          </button>

          {/* Gate Pulses */}
          <button
            onClick={() => setShowGate(!showGate)}
            className={`px-2 py-0.5 text-xs font-mono rounded border flex items-center gap-1.5 transition-colors ${
              showGate
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <span>Gate Pulses (α={alphaDeg}°)</span>
          </button>
        </div>

        {/* Average Line Toggles */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-200">
            <input
              type="checkbox"
              checked={showAverageLines}
              onChange={(e) => setShowAverageLines(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="text-[11px] font-mono">Show V_dc / I_dc Lines</span>
          </label>
        </div>
      </div>

      {/* Main Screen SVG Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full h-[400px] bg-[#070b12] scope-grid cursor-crosshair select-none"
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid Divisions (10 horizontal, 8 vertical) */}
          {Array.from({ length: 11 }).map((_, i) => {
            const x = padLeft + (i / 10) * plotWidth;
            return (
              <line
                key={`gx-${i}`}
                x1={x}
                y1={padTop}
                x2={x}
                y2={padTop + plotHeight}
                stroke="#1e293b"
                strokeWidth={i % 5 === 0 ? '1.2' : '0.6'}
                strokeDasharray={i % 5 === 0 ? undefined : '2 2'}
              />
            );
          })}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = padTop + (i / 8) * plotHeight;
            return (
              <line
                key={`gy-${i}`}
                x1={padLeft}
                y1={y}
                x2={padLeft + plotWidth}
                y2={y}
                stroke="#1e293b"
                strokeWidth={i === 4 ? '1.2' : '0.6'}
                strokeDasharray={i === 4 ? undefined : '2 2'}
              />
            );
          })}

          {/* Zero Voltage Axis Line */}
          {getZeroYV >= padTop && getZeroYV <= padTop + plotHeight && (
            <line
              x1={padLeft}
              y1={getZeroYV}
              x2={padLeft + plotWidth}
              y2={getZeroYV}
              stroke="#475569"
              strokeWidth="1.5"
            />
          )}

          {/* Left Y-Axis (Voltage Scale) Labels */}
          <text x={padLeft - 8} y={padTop + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            +{scales.vUpper.toFixed(0)}V
          </text>
          <text x={padLeft - 8} y={getZeroYV + 3} textAnchor="end" fill="#cbd5e1" fontSize="10" fontFamily="monospace" fontWeight="bold">
            0V
          </text>
          <text x={padLeft - 8} y={padTop + plotHeight} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {scales.vLower.toFixed(0)}V
          </text>

          {/* Right Y-Axis (Current Scale) Labels */}
          <text x={svgWidth - padRight + 8} y={padTop + 4} textAnchor="start" fill="#f59e0b" fontSize="10" fontFamily="monospace">
            +{scales.iUpper.toFixed(1)}A
          </text>
          <text x={svgWidth - padRight + 8} y={getZeroYI + 3} textAnchor="start" fill="#fbbf24" fontSize="10" fontFamily="monospace">
            0A
          </text>
          <text x={svgWidth - padRight + 8} y={padTop + plotHeight} textAnchor="start" fill="#f59e0b" fontSize="10" fontFamily="monospace">
            {scales.iLower.toFixed(1)}A
          </text>

          {/* Bottom Time Axis Labels */}
          {Array.from({ length: 6 }).map((_, i) => {
            const frac = i / 5;
            const tVal = frac * scales.tMax;
            const x = padLeft + frac * plotWidth;
            return (
              <g key={`tlabel-${i}`}>
                <line x1={x} y1={padTop + plotHeight} x2={x} y2={padTop + plotHeight + 5} stroke="#475569" />
                <text x={x} y={padTop + plotHeight + 18} textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                  {tVal.toFixed(1)}ms
                </text>
                <text x={x} y={padTop + plotHeight + 30} textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                  {(frac * displayCycles * 360).toFixed(0)}°
                </text>
              </g>
            );
          })}

          {/* Waveform Channels */}

          {/* Supply Voltage Vs (CH3) */}
          {showVs && (
            <g>
              <path
                d={pathVs}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.4"
                strokeDasharray="4 2"
              />
              {pathVsB && (
                <path
                  d={pathVsB}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                />
              )}
              {pathVsC && (
                <path
                  d={pathVsC}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="1"
                  strokeOpacity="0.25"
                />
              )}
            </g>
          )}

          {/* Thyristor Device Voltage vT1 (CH5) */}
          {showVDevice && (
            <path
              d={pathVDevice}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
              strokeOpacity="0.8"
            />
          )}

          {/* Instantaneous Power Po (CH6) */}
          {showPo && (
            <path
              d={pathPo}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.6"
              strokeOpacity="0.8"
            />
          )}

          {/* Supply Current Is (CH4) */}
          {showIs && (
            <path
              d={pathIs}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeOpacity="0.75"
            />
          )}

          {/* Load Voltage Vo (CH1) - Primary */}
          {showVo && (
            <g>
              {/* Soft glow underlying path */}
              <path
                d={pathVo}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="4"
                strokeOpacity="0.25"
              />
              <path
                d={pathVo}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Load Current Io (CH2) - Primary */}
          {showIo && (
            <g>
              <path
                d={pathIo}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="4"
                strokeOpacity="0.25"
              />
              <path
                d={pathIo}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Gate Pulses (bottom ticks) */}
          {showGate && (
            <g>
              {visiblePoints.map((p, idx) => {
                if (p.gatePulse === 1) {
                  const x = getX(p.t);
                  return (
                    <g key={`gate-${idx}`}>
                      <line
                        x1={x}
                        y1={padTop + plotHeight - 18}
                        x2={x}
                        y2={padTop + plotHeight}
                        stroke="#e2e8f0"
                        strokeWidth="2"
                      />
                      <polygon
                        points={`${x - 3},${padTop + plotHeight - 18} ${x + 3},${padTop + plotHeight - 18} ${x},${padTop + plotHeight - 24}`}
                        fill="#38bdf8"
                      />
                    </g>
                  );
                }
                return null;
              })}
            </g>
          )}

          {/* Average V_dc & I_dc Dashed Level Lines */}
          {showAverageLines && (
            <g>
              {showVo && (
                <g>
                  <line
                    x1={padLeft}
                    y1={getYV(metrics.vdc)}
                    x2={padLeft + plotWidth}
                    y2={getYV(metrics.vdc)}
                    stroke="#06b6d4"
                    strokeWidth="1.2"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={padLeft + 10}
                    y={getYV(metrics.vdc) - 4}
                    fill="#22d3ee"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    V_dc = {metrics.vdc}V
                  </text>
                </g>
              )}

              {showIo && (
                <g>
                  <line
                    x1={padLeft}
                    y1={getYI(metrics.idc)}
                    x2={padLeft + plotWidth}
                    y2={getYI(metrics.idc)}
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={padLeft + plotWidth - 100}
                    y={getYI(metrics.idc) - 4}
                    fill="#fbbf24"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    I_dc = {metrics.idc}A
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Oscilloscope Moving Sweep Scanline */}
          {isLiveSweeping && (
            <g>
              <line
                x1={padLeft + sweepProgress * plotWidth}
                y1={padTop}
                x2={padLeft + sweepProgress * plotWidth}
                y2={padTop + plotHeight}
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.8"
              />
              <circle
                cx={padLeft + sweepProgress * plotWidth}
                cy={padTop + 2}
                r="3"
                fill="#38bdf8"
              />
            </g>
          )}

          {/* Dual Measurement Cursors (Cursor A & B) */}
          {enableCursors && (
            <g>
              {/* Cursor A (Green) */}
              <g
                className="cursor-ew-resize"
                onMouseDown={() => setActiveCursorDrag('A')}
              >
                <line
                  x1={padLeft + cursorAPct * plotWidth}
                  y1={padTop}
                  x2={padLeft + cursorAPct * plotWidth}
                  y2={padTop + plotHeight}
                  stroke="#10b981"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                <rect
                  x={padLeft + cursorAPct * plotWidth - 12}
                  y={padTop - 18}
                  width="24"
                  height="16"
                  fill="#065f46"
                  stroke="#10b981"
                  rx="3"
                />
                <text
                  x={padLeft + cursorAPct * plotWidth}
                  y={padTop - 6}
                  textAnchor="middle"
                  fill="#6ee7b7"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  A
                </text>
              </g>

              {/* Cursor B (Amber) */}
              <g
                className="cursor-ew-resize"
                onMouseDown={() => setActiveCursorDrag('B')}
              >
                <line
                  x1={padLeft + cursorBPct * plotWidth}
                  y1={padTop}
                  x2={padLeft + cursorBPct * plotWidth}
                  y2={padTop + plotHeight}
                  stroke="#f59e0b"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                <rect
                  x={padLeft + cursorBPct * plotWidth - 12}
                  y={padTop - 18}
                  width="24"
                  height="16"
                  fill="#78350f"
                  stroke="#f59e0b"
                  rx="3"
                />
                <text
                  x={padLeft + cursorBPct * plotWidth}
                  y={padTop - 6}
                  textAnchor="middle"
                  fill="#fde68a"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  B
                </text>
              </g>
            </g>
          )}

          {/* Mouse Hover Crosshair Probe */}
          {hoverPoint && (
            <g>
              {/* Vertical line */}
              <line
                x1={getX(hoverPoint.t)}
                y1={padTop}
                x2={getX(hoverPoint.t)}
                y2={padTop + plotHeight}
                stroke="#e2e8f0"
                strokeWidth="1"
                strokeDasharray="2 2"
                strokeOpacity="0.8"
              />
              {/* Vo intersection marker */}
              {showVo && (
                <circle
                  cx={getX(hoverPoint.t)}
                  cy={getYV(hoverPoint.vo)}
                  r="4.5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
              {/* Io intersection marker */}
              {showIo && (
                <circle
                  cx={getX(hoverPoint.t)}
                  cy={getYI(hoverPoint.io)}
                  r="4.5"
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )}
            </g>
          )}
        </svg>

        {/* Floating Real-time HUD telemetry tag on hover */}
        {hoverPoint && (
          <div
            className="absolute top-2 left-20 bg-slate-950/90 border border-slate-700/80 rounded px-2.5 py-1 text-xs font-mono shadow-lg pointer-events-none flex items-center gap-4 text-slate-300 backdrop-blur"
          >
            <div>
              <span className="text-slate-500">t:</span>{' '}
              <span className="text-white font-semibold">{hoverPoint.t}ms</span>{' '}
              <span className="text-slate-500">({hoverPoint.omegaTDeg}°)</span>
            </div>
            {showVo && (
              <div>
                <span className="text-cyan-400">v_o:</span>{' '}
                <span className="text-cyan-200 font-bold">{hoverPoint.vo}V</span>
              </div>
            )}
            {showIo && (
              <div>
                <span className="text-amber-400">i_o:</span>{' '}
                <span className="text-amber-200 font-bold">{hoverPoint.io}A</span>
              </div>
            )}
            {showVs && (
              <div>
                <span className="text-sky-400">v_s:</span>{' '}
                <span className="text-sky-200">{hoverPoint.vs}V</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">State:</span>{' '}
              <span className="text-emerald-400 font-semibold">{hoverPoint.conductingState}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Cursors Measurement Ribbon (when enabled) */}
      {enableCursors && (
        <div className="bg-slate-950 px-4 py-2 border-t border-slate-800 text-xs font-mono flex flex-wrap items-center justify-between gap-4 text-slate-300">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
              <span className="text-emerald-400 font-semibold">Cursor A:</span>
              <span>t={cursorAPt?.t}ms</span>
              <span>v_o={cursorAPt?.vo}V</span>
              <span>i_o={cursorAPt?.io}A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
              <span className="text-amber-400 font-semibold">Cursor B:</span>
              <span>t={cursorBPt?.t}ms</span>
              <span>v_o={cursorBPt?.vo}V</span>
              <span>i_o={cursorBPt?.io}A</span>
            </div>
          </div>

          <div className="flex items-center gap-5 text-cyan-300">
            <div>
              Δt: <strong className="text-white font-bold">{deltaT.toFixed(2)} ms</strong>
            </div>
            <div>
              Δθ: <strong className="text-white font-bold">{deltaDeg.toFixed(1)}°</strong>
            </div>
            <div>
              1/Δt: <strong className="text-white font-bold">{deltaFreq} Hz</strong>
            </div>
            <div>
              ΔVo: <strong className="text-white font-bold">{deltaVo} V</strong>
            </div>
            <div>
              ΔIo: <strong className="text-white font-bold">{deltaIo} A</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
