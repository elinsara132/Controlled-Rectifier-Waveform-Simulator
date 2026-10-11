import React from 'react';
import { CircuitParameters, TopologyType, LoadType } from '../types/rectifier';

interface CircuitSchematicProps {
  params: CircuitParameters;
  activeDeviceState: string;
  isConducting?: boolean;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  params,
  activeDeviceState,
}) => {
  const { topology, loadType, resistance, inductanceMh, backEmf, capacitanceUf } = params;
  const is3Phase = topology.startsWith('3P_');

  // Check which devices are currently conducting
  const stateUpper = activeDeviceState.toUpperCase();
  const isT1On = stateUpper.includes('T1') || (topology === '1P_HALF_WAVE' && stateUpper.includes('SCR'));
  const isT2On = stateUpper.includes('T2');
  const isT3On = stateUpper.includes('T3');
  const isT4On = stateUpper.includes('T4');
  const isT5On = stateUpper.includes('T5');
  const isT6On = stateUpper.includes('T6');
  const isD1On = stateUpper.includes('D1');
  const isD2On = stateUpper.includes('D2');
  const isD3On = stateUpper.includes('D3');
  const isD4On = stateUpper.includes('D4');
  const isD5On = stateUpper.includes('D5');
  const isD6On = stateUpper.includes('D6');
  const isFWDOn = stateUpper.includes('FREEWHEEL');

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
            Interactive Circuit Schematic
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-xs text-slate-400">
            {is3Phase ? '3-Phase' : '1-Phase'} {topology.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Active State:</span>
          <span
            className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
              activeDeviceState !== 'Blocked' && activeDeviceState !== 'None'
                ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-700/50'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {activeDeviceState}
          </span>
        </div>
      </div>

      {/* SVG Canvas for Schematic */}
      <div className="relative w-full h-52 flex items-center justify-center bg-slate-950/60 rounded border border-slate-800/60 overflow-hidden">
        <svg
          viewBox="0 0 620 220"
          className="w-full h-full max-h-52 select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Glow filter for active conducting lines */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Current flow animation marker */}
            <marker
              id="flowArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#06b6d4" />
            </marker>
          </defs>

          {is3Phase ? (
            /* --- 3-PHASE RECTIFIER SCHEMATIC --- */
            <g transform="translate(10, 10)">
              {/* 3-Phase AC Source */}
              <g transform="translate(20, 30)">
                <circle cx="20" cy="30" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <text x="20" y="34" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">Va</text>
                
                <circle cx="20" cy="75" r="14" fill="#0f172a" stroke="#fbbf24" strokeWidth="2" />
                <text x="20" y="79" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">Vb</text>

                <circle cx="20" cy="120" r="14" fill="#0f172a" stroke="#f43f5e" strokeWidth="2" />
                <text x="20" y="124" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">Vc</text>

                {/* Lines to Bridge legs */}
                <path d="M 34 30 L 140 30" stroke="#38bdf8" strokeWidth="2" />
                <path d="M 34 75 L 210 75" stroke="#fbbf24" strokeWidth="2" />
                <path d="M 34 120 L 280 120" stroke="#f43f5e" strokeWidth="2" />
              </g>

              {/* DC Bus Rails */}
              {/* Positive Rail */}
              <line x1="140" y1="18" x2="430" y2="18" stroke="#06b6d4" strokeWidth="2.5" />
              <text x="415" y="12" fill="#06b6d4" fontSize="10" fontWeight="bold">+ (V_dc)</text>

              {/* Negative Rail */}
              <line x1="140" y1="180" x2="430" y2="180" stroke="#64748b" strokeWidth="2.5" />
              <text x="415" y="196" fill="#94a3b8" fontSize="10" fontWeight="bold">- (GND)</text>

              {/* Leg A: T1 (top) and T4 (bottom) */}
              <g transform="translate(140, 0)">
                {/* Upper switch T1 */}
                <line x1="0" y1="18" x2="0" y2="45" stroke="#94a3b8" strokeWidth="2" />
                <ThyristorSymbol
                  x={0}
                  y={60}
                  label="T1"
                  isActive={isT1On}
                  isThyristor={true}
                />
                <line x1="0" y1="75" x2="0" y2="105" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="0" cy="60" r="2.5" fill="#38bdf8" />

                {/* Lower switch T4 / D4 */}
                <ThyristorSymbol
                  x={0}
                  y={135}
                  label={topology === '3P_SEMI_CONVERTER' ? 'D4' : 'T4'}
                  isActive={topology === '3P_SEMI_CONVERTER' ? isD4On : isT4On}
                  isThyristor={topology === '3P_FULL_BRIDGE'}
                />
                <line x1="0" y1="150" x2="0" y2="180" stroke="#94a3b8" strokeWidth="2" />
              </g>

              {/* Leg B: T3 (top) and T6 (bottom) */}
              <g transform="translate(210, 0)">
                <line x1="0" y1="18" x2="0" y2="45" stroke="#94a3b8" strokeWidth="2" />
                <ThyristorSymbol
                  x={0}
                  y={60}
                  label="T3"
                  isActive={isT3On}
                  isThyristor={true}
                />
                <line x1="0" y1="75" x2="0" y2="105" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="0" cy="105" r="2.5" fill="#fbbf24" />

                <ThyristorSymbol
                  x={0}
                  y={135}
                  label={topology === '3P_SEMI_CONVERTER' ? 'D6' : 'T6'}
                  isActive={topology === '3P_SEMI_CONVERTER' ? isD6On : isT6On}
                  isThyristor={topology === '3P_FULL_BRIDGE'}
                />
                <line x1="0" y1="150" x2="0" y2="180" stroke="#94a3b8" strokeWidth="2" />
              </g>

              {/* Leg C: T5 (top) and T2 (bottom) */}
              <g transform="translate(280, 0)">
                <line x1="0" y1="18" x2="0" y2="45" stroke="#94a3b8" strokeWidth="2" />
                <ThyristorSymbol
                  x={0}
                  y={60}
                  label="T5"
                  isActive={isT5On}
                  isThyristor={true}
                />
                <line x1="0" y1="75" x2="0" y2="150" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="0" cy="150" r="2.5" fill="#f43f5e" />

                <ThyristorSymbol
                  x={0}
                  y={135}
                  label={topology === '3P_SEMI_CONVERTER' ? 'D2' : 'T2'}
                  isActive={topology === '3P_SEMI_CONVERTER' ? isD2On : isT2On}
                  isThyristor={topology === '3P_FULL_BRIDGE'}
                />
                <line x1="0" y1="150" x2="0" y2="180" stroke="#94a3b8" strokeWidth="2" />
              </g>

              {/* Load Branch */}
              <LoadBranchSymbol
                x={440}
                topY={18}
                bottomY={180}
                loadType={loadType}
                resistance={resistance}
                inductanceMh={inductanceMh}
                backEmf={backEmf}
                capacitanceUf={capacitanceUf}
                isFWDOn={isFWDOn}
              />
            </g>
          ) : (
            /* --- 1-PHASE RECTIFIER SCHEMATIC --- */
            <g transform="translate(20, 10)">
              {/* AC Voltage Source */}
              <g transform="translate(35, 95)">
                <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                {/* Sine wave icon */}
                <path
                  d="M -9 0 Q -4 -9, 0 0 Q 4 9, 9 0"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                <text x="0" y="28" textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {params.vsRms}V / {params.frequency}Hz
                </text>
                <text x="-24" y="4" fill="#38bdf8" fontSize="11" fontWeight="bold">vs(t)</text>
              </g>

              {/* AC Input Wire Rails */}
              <line x1="53" y1="95" x2="160" y2="95" stroke="#38bdf8" strokeWidth="2" />

              {topology === '1P_HALF_WAVE' ? (
                /* Half-Wave single switch circuit */
                <g>
                  {/* Wire from AC to SCR */}
                  <line x1="53" y1="95" x2="180" y2="95" stroke="#38bdf8" strokeWidth="2" />
                  <ThyristorSymbol
                    x={220}
                    y={95}
                    label="SCR T1"
                    isActive={isT1On}
                    isThyristor={true}
                    rotation={-90}
                  />
                  <line x1="240" y1="95" x2="380" y2="95" stroke="#06b6d4" strokeWidth="2" />
                  
                  {/* Load Branch */}
                  <LoadBranchSymbol
                    x={420}
                    topY={40}
                    bottomY={160}
                    loadType={loadType}
                    resistance={resistance}
                    inductanceMh={inductanceMh}
                    backEmf={backEmf}
                    capacitanceUf={capacitanceUf}
                    isFWDOn={isFWDOn}
                    hasFreewheelDiode={loadType === 'RL_FWD'}
                  />

                  {/* Wire back from load to AC source */}
                  <path
                    d="M 380 95 L 380 40 L 420 40"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="2"
                  />
                  <path
                    d="M 420 160 L 35 160 L 35 113"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                </g>
              ) : (
                /* Full Bridge / Semi-Converter / Diode Bridge (4 switches) */
                <g>
                  {/* Positive Bus */}
                  <line x1="200" y1="25" x2="430" y2="25" stroke="#06b6d4" strokeWidth="2.5" />
                  <text x="410" y="16" fill="#06b6d4" fontSize="10" fontWeight="bold">+ (V_dc)</text>

                  {/* Negative Bus */}
                  <line x1="200" y1="175" x2="430" y2="175" stroke="#64748b" strokeWidth="2.5" />
                  <text x="410" y="190" fill="#94a3b8" fontSize="10" fontWeight="bold">- (Return)</text>

                  {/* Leg 1: T1 (top) and T4 (bottom) */}
                  <g transform="translate(200, 0)">
                    <line x1="0" y1="25" x2="0" y2="50" stroke="#94a3b8" strokeWidth="2" />
                    <ThyristorSymbol
                      x={0}
                      y={65}
                      label={topology === '1P_DIODE_BRIDGE' ? 'D1' : 'T1'}
                      isActive={topology === '1P_DIODE_BRIDGE' ? isD1On : isT1On}
                      isThyristor={topology !== '1P_DIODE_BRIDGE'}
                    />
                    <line x1="0" y1="80" x2="0" y2="120" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="0" cy="95" r="3" fill="#38bdf8" />
                    <line x1="-40" y1="95" x2="0" y2="95" stroke="#38bdf8" strokeWidth="2" />

                    <ThyristorSymbol
                      x={0}
                      y={135}
                      label={
                        topology === '1P_DIODE_BRIDGE'
                          ? 'D4'
                          : topology === '1P_SEMI_CONVERTER'
                          ? 'D4'
                          : 'T4'
                      }
                      isActive={
                        topology === '1P_SEMI_CONVERTER'
                          ? isD4On || isT4On
                          : topology === '1P_DIODE_BRIDGE'
                          ? isD4On
                          : isT4On
                      }
                      isThyristor={topology === '1P_FULL_BRIDGE' || topology === '1P_MID_POINT'}
                    />
                    <line x1="0" y1="150" x2="0" y2="175" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Leg 2: T3 (top) and T2 (bottom) */}
                  <g transform="translate(300, 0)">
                    <line x1="0" y1="25" x2="0" y2="50" stroke="#94a3b8" strokeWidth="2" />
                    <ThyristorSymbol
                      x={0}
                      y={65}
                      label={
                        topology === '1P_DIODE_BRIDGE'
                          ? 'D3'
                          : topology === '1P_SEMI_CONVERTER'
                          ? 'T3'
                          : 'T3'
                      }
                      isActive={isT3On || (topology === '1P_DIODE_BRIDGE' && isD3On)}
                      isThyristor={topology !== '1P_DIODE_BRIDGE'}
                    />
                    <line x1="0" y1="80" x2="0" y2="120" stroke="#94a3b8" strokeWidth="2" />
                    <circle cx="0" cy="115" r="3" fill="#38bdf8" />
                    
                    {/* AC return connection crossing */}
                    <path
                      d="M -140 115 L 0 115"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    <ThyristorSymbol
                      x={0}
                      y={135}
                      label={
                        topology === '1P_DIODE_BRIDGE'
                          ? 'D2'
                          : topology === '1P_SEMI_CONVERTER'
                          ? 'D2'
                          : 'T2'
                      }
                      isActive={
                        topology === '1P_SEMI_CONVERTER'
                          ? isD2On || isT2On
                          : topology === '1P_DIODE_BRIDGE'
                          ? isD2On
                          : isT2On
                      }
                      isThyristor={topology === '1P_FULL_BRIDGE' || topology === '1P_MID_POINT'}
                    />
                    <line x1="0" y1="150" x2="0" y2="175" stroke="#94a3b8" strokeWidth="2" />
                  </g>

                  {/* Load Branch */}
                  <LoadBranchSymbol
                    x={450}
                    topY={25}
                    bottomY={175}
                    loadType={loadType}
                    resistance={resistance}
                    inductanceMh={inductanceMh}
                    backEmf={backEmf}
                    capacitanceUf={capacitanceUf}
                    isFWDOn={isFWDOn}
                    hasFreewheelDiode={loadType === 'RL_FWD'}
                  />
                </g>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Conduction Legend Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-1 border-t border-slate-800/60 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            <span>Active Thyristor/Diode</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-600"></span>
            <span>Reverse Biased / Off</span>
          </span>
          {loadType === 'RL_FWD' && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]"></span>
              <span>Freewheeling Action</span>
            </span>
          )}
        </div>
        <div className="text-slate-400">
          Pulse Count: <span className="text-cyan-300 font-semibold">{is3Phase ? 6 : (topology === '1P_HALF_WAVE' ? 1 : 2)}-Pulse</span>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Clean Thyristor or Diode Schematic Symbol
interface ThyristorSymbolProps {
  x: number;
  y: number;
  label: string;
  isActive: boolean;
  isThyristor: boolean;
  rotation?: number;
}

const ThyristorSymbol: React.FC<ThyristorSymbolProps> = ({
  x,
  y,
  label,
  isActive,
  isThyristor,
  rotation = 0,
}) => {
  const activeColor = isActive ? '#06b6d4' : '#94a3b8';
  const fillColor = isActive ? 'rgba(6, 182, 212, 0.25)' : '#0f172a';
  const filter = isActive ? 'url(#cyanGlow)' : undefined;

  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Diode Triangle */}
      <polygon
        points="-12,-10 12,-10 0,10"
        fill={fillColor}
        stroke={activeColor}
        strokeWidth="2"
        filter={filter}
      />
      {/* Cathode Bar */}
      <line x1="-12" y1="10" x2="12" y2="10" stroke={activeColor} strokeWidth="2.5" />

      {/* Thyristor Gate Terminal */}
      {isThyristor && (
        <path
          d="M 6 10 L 14 18 L 20 18"
          fill="none"
          stroke={isActive ? '#38bdf8' : '#64748b'}
          strokeWidth="1.5"
        />
      )}

      {/* Device Label */}
      <text
        x={rotation === 0 ? 18 : 0}
        y={rotation === 0 ? 0 : -16}
        fill={isActive ? '#22d3ee' : '#94a3b8'}
        fontSize="9"
        fontWeight={isActive ? 'bold' : 'normal'}
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );
};

// Sub-component: Load Branch (R, L, E, C, Freewheel diode)
interface LoadBranchProps {
  x: number;
  topY: number;
  bottomY: number;
  loadType: LoadType;
  resistance: number;
  inductanceMh: number;
  backEmf: number;
  capacitanceUf: number;
  isFWDOn?: boolean;
  hasFreewheelDiode?: boolean;
}

const LoadBranchSymbol: React.FC<LoadBranchProps> = ({
  x,
  topY,
  bottomY,
  loadType,
  resistance,
  inductanceMh,
  backEmf,
  capacitanceUf,
  isFWDOn = false,
  hasFreewheelDiode = false,
}) => {
  const height = bottomY - topY;
  const centerY = (topY + bottomY) / 2;

  return (
    <g transform={`translate(${x}, 0)`}>
      {/* Inbound rail connector */}
      <line x1="-20" y1={topY} x2="40" y2={topY} stroke="#06b6d4" strokeWidth="2" />
      <line x1="-20" y1={bottomY} x2="40" y2={bottomY} stroke="#64748b" strokeWidth="2" />

      {/* Optional Freewheeling Diode (FWD) branch */}
      {hasFreewheelDiode && (
        <g transform="translate(0, 0)">
          <line x1="0" y1={topY} x2="0" y2={centerY - 15} stroke="#94a3b8" strokeWidth="1.5" />
          {/* Diode pointing upward (cathode at top rail, anode at bottom) */}
          <polygon
            points="-8,8 8,8 0,-8"
            fill={isFWDOn ? 'rgba(245, 158, 11, 0.3)' : '#0f172a'}
            stroke={isFWDOn ? '#f59e0b' : '#94a3b8'}
            strokeWidth="2"
            filter={isFWDOn ? 'url(#amberGlow)' : undefined}
            transform={`translate(0, ${centerY})`}
          />
          <line
            x1="-8"
            y1={centerY - 8}
            x2="8"
            y2={centerY - 8}
            stroke={isFWDOn ? '#f59e0b' : '#94a3b8'}
            strokeWidth="2"
          />
          <line x1="0" y1={centerY + 8} x2="0" y2={bottomY} stroke="#94a3b8" strokeWidth="1.5" />
          <text x="10" y={centerY + 4} fill={isFWDOn ? '#f59e0b' : '#94a3b8'} fontSize="8" fontFamily="monospace">
            FWD
          </text>
        </g>
      )}

      {/* Main Load Stack */}
      <g transform="translate(40, 0)">
        <line x1="0" y1={topY} x2="0" y2={topY + 15} stroke="#06b6d4" strokeWidth="2" />

        {/* Resistor symbol */}
        <g transform={`translate(0, ${topY + 30})`}>
          <rect x="-8" y="-12" width="16" height="24" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="2" />
          <text x="14" y="4" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
            R={resistance}Ω
          </text>
        </g>
        <line x1="0" y1={topY + 42} x2="0" y2={topY + 54} stroke="#06b6d4" strokeWidth="2" />

        {/* Inductor symbol (RL / RLE / HIGH_L) */}
        {(loadType === 'RL' || loadType === 'RL_FWD' || loadType === 'RLE' || loadType === 'HIGH_L') && (
          <g transform={`translate(0, ${topY + 70})`}>
            {/* Inductor coil loops */}
            <path
              d="M 0 -14 Q 8 -10, 0 -6 Q 8 -2, 0 2 Q 8 6, 0 10 Q 8 14, 0 18"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
            />
            <text x="14" y="6" fill="#d8b4fe" fontSize="9" fontFamily="monospace">
              {loadType === 'HIGH_L' ? 'L=∞ (ideal)' : `L=${inductanceMh}mH`}
            </text>
            <line x1="0" y1="18" x2="0" y2="28" stroke="#06b6d4" strokeWidth="2" />
          </g>
        )}

        {/* Capacitor symbol (RC) */}
        {loadType === 'RC' && (
          <g transform={`translate(0, ${topY + 70})`}>
            <line x1="-10" y1="-4" x2="10" y2="-4" stroke="#10b981" strokeWidth="2.5" />
            <line x1="-10" y1="4" x2="10" y2="4" stroke="#10b981" strokeWidth="2.5" />
            <text x="14" y="4" fill="#6ee7b7" fontSize="9" fontFamily="monospace">
              C={capacitanceUf}μF
            </text>
            <line x1="0" y1="4" x2="0" y2="28" stroke="#06b6d4" strokeWidth="2" />
          </g>
        )}

        {/* DC Back-EMF / Battery symbol (RLE) */}
        {loadType === 'RLE' && (
          <g transform={`translate(0, ${topY + 115})`}>
            {/* Long positive plate */}
            <line x1="-12" y1="-5" x2="12" y2="-5" stroke="#ef4444" strokeWidth="2" />
            <text x="-18" y="-3" fill="#ef4444" fontSize="8" fontWeight="bold">+</text>
            {/* Short negative plate */}
            <line x1="-6" y1="3" x2="6" y2="3" stroke="#64748b" strokeWidth="3" />
            <text x="-16" y="7" fill="#94a3b8" fontSize="8">-</text>
            <text x="14" y="3" fill="#fca5a5" fontSize="9" fontFamily="monospace">
              E={backEmf}V
            </text>
            <line x1="0" y1="3" x2="0" y2={bottomY - (topY + 115)} stroke="#64748b" strokeWidth="2" />
          </g>
        )}

        {/* Bottom wire connection */}
        {loadType !== 'RLE' && (
          <line
            x1="0"
            y1={loadType === 'R' ? topY + 42 : topY + 98}
            x2="0"
            y2={bottomY}
            stroke="#64748b"
            strokeWidth="2"
          />
        )}
      </g>
    </g>
  );
};
