/**
 * Power Electronics Rectifier Types & Configurations
 */

export type TopologyType =
  | '1P_HALF_WAVE'
  | '1P_MID_POINT'
  | '1P_FULL_BRIDGE'
  | '1P_SEMI_CONVERTER'
  | '1P_DIODE_BRIDGE'
  | '3P_HALF_WAVE'
  | '3P_FULL_BRIDGE'
  | '3P_SEMI_CONVERTER'
  | '3P_DIODE_BRIDGE';

export type LoadType =
  | 'R'
  | 'RL'
  | 'RL_FWD'
  | 'RLE'
  | 'HIGH_L'
  | 'RC';

export interface CircuitParameters {
  topology: TopologyType;
  loadType: LoadType;
  vsRms: number;        // Supply AC Voltage RMS (V)
  frequency: number;    // Line Frequency (Hz)
  alphaDeg: number;     // Firing angle alpha (degrees, 0-180)
  resistance: number;   // Load Resistance R (Ohms)
  inductanceMh: number; // Load Inductance L (mH)
  backEmf: number;      // DC Back EMF or Battery Voltage E (V)
  capacitanceUf: number;// Filter capacitance (uF, for RC)
  sourceInductanceUh: number; // Commutation overlap inductance (uH, optional)
}

export interface WaveformPoint {
  t: number;            // Time in milliseconds
  omegaT: number;       // Angle in radians
  omegaTDeg: number;    // Angle in degrees
  vs: number;           // Supply voltage (phase A for 3-phase)
  vsB?: number;         // Phase B voltage (3-phase)
  vsC?: number;         // Phase C voltage (3-phase)
  is: number;           // Supply input current (A)
  vo: number;           // Instantaneous load voltage (V)
  io: number;           // Instantaneous load current (A)
  po: number;           // Instantaneous load power (W)
  vDevice: number;      // Voltage across Thyristor/Diode 1 (V)
  gatePulse: number;    // Gate firing pulse (0 or 1)
  conductingState: string; // Active devices, e.g. "T1, T2" or "FWD" or "NONE"
}

export interface HarmonicComponent {
  order: number;
  frequencyHz: number;
  amplitude: number;    // Peak or RMS amplitude (V)
  percentageOfDc: number;
}

export interface SimulationMetrics {
  vdc: number;          // Average output voltage (V)
  vorms: number;        // RMS output voltage (V)
  idc: number;          // Average output current (A)
  iorms: number;        // RMS output current (A)
  pdc: number;          // DC Power (W)
  pac: number;          // AC Power delivered (W)
  efficiency: number;   // Rectification efficiency (%)
  formFactor: number;   // Form factor = Vorms / Vdc
  rippleFactor: number; // Ripple factor = sqrt(FF^2 - 1)
  voltageRipplePkPk: number; // Peak-to-peak ripple voltage (V)
  currentRipplePkPk: number; // Peak-to-peak ripple current (A)
  thdCurrent: number;   // Total Harmonic Distortion of input current (%)
  powerFactor: number;  // Input power factor
  displacementFactor: number; // cos(phi_1)
  pivDevice: number;    // Peak Inverse Voltage across device (V)
  conductionMode: 'CCM' | 'DCM'; // Continuous vs Discontinuous
  extinctionAngleDeg: number; // Beta (degrees)
  conductionAngleDeg: number; // Gamma = Beta - Alpha (degrees)
  harmonics: HarmonicComponent[];
}

export interface TopologyMeta {
  id: TopologyType;
  name: string;
  category: '1-Phase' | '3-Phase';
  shortDesc: string;
  switches: string;
  pulseCount: number;
  theoreticalVdcFormula: string;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  params: CircuitParameters;
}
