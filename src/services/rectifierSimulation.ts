import {
  CircuitParameters,
  HarmonicComponent,
  LoadType,
  SimulationMetrics,
  TopologyMeta,
  TopologyType,
  WaveformPoint,
} from '../types/rectifier';

export const TOPOLOGY_METAS: Record<TopologyType, TopologyMeta> = {
  '1P_HALF_WAVE': {
    id: '1P_HALF_WAVE',
    name: '1-Phase Half-Wave Controlled',
    category: '1-Phase',
    shortDesc: 'Single thyristor converter. Basic introductory topology with high ripple and DC component in supply current.',
    switches: '1 SCR (T1)',
    pulseCount: 1,
    theoreticalVdcFormula: 'V_m / (2π) · (1 + cos α)',
  },
  '1P_MID_POINT': {
    id: '1P_MID_POINT',
    name: '1-Phase Mid-Point (Center-Tapped)',
    category: '1-Phase',
    shortDesc: 'Center-tapped transformer with 2 SCRs providing full-wave rectification. SCRs must withstand 2·Vm PIV.',
    switches: '2 SCRs (T1, T2)',
    pulseCount: 2,
    theoreticalVdcFormula: '2·V_m / π · cos α (CCM)',
  },
  '1P_FULL_BRIDGE': {
    id: '1P_FULL_BRIDGE',
    name: '1-Phase Fully Controlled Bridge',
    category: '1-Phase',
    shortDesc: 'Standard 4-SCR bridge converter. Allows two-quadrant operation (rectification α < 90°, inversion α > 90° with active E load).',
    switches: '4 SCRs (T1–T4)',
    pulseCount: 2,
    theoreticalVdcFormula: '2·V_m / π · cos α (CCM)',
  },
  '1P_SEMI_CONVERTER': {
    id: '1P_SEMI_CONVERTER',
    name: '1-Phase Semi-Controlled Bridge',
    category: '1-Phase',
    shortDesc: 'Half-controlled bridge with 2 SCRs and 2 diodes. Inherent freewheeling prevents negative load voltage and improves power factor.',
    switches: '2 SCRs + 2 Diodes',
    pulseCount: 2,
    theoreticalVdcFormula: 'V_m / π · (1 + cos α)',
  },
  '1P_DIODE_BRIDGE': {
    id: '1P_DIODE_BRIDGE',
    name: '1-Phase Uncontrolled Diode Bridge',
    category: '1-Phase',
    shortDesc: 'Standard 4-diode rectifier bridge with natural zero-crossing commutation (equivalent to α = 0°).',
    switches: '4 Diodes (D1–D4)',
    pulseCount: 2,
    theoreticalVdcFormula: '2·V_m / π ≈ 0.90 · V_rms',
  },
  '3P_HALF_WAVE': {
    id: '3P_HALF_WAVE',
    name: '3-Phase Half-Wave Controlled',
    category: '3-Phase',
    shortDesc: 'Star-connected 3-SCR converter. Firing reference starts at 30° phase crossover. 3-pulse ripple frequency (3f).',
    switches: '3 SCRs (T1–T3)',
    pulseCount: 3,
    theoreticalVdcFormula: '3√3·V_m,ph / (2π) · cos α',
  },
  '3P_FULL_BRIDGE': {
    id: '3P_FULL_BRIDGE',
    name: '3-Phase Fully Controlled Bridge (6-Pulse)',
    category: '3-Phase',
    shortDesc: 'Industry-standard 6-thyristor Graetz bridge. 6-pulse ripple, low ripple factor, capable of full two-quadrant DC motor drive control.',
    switches: '6 SCRs (T1–T6)',
    pulseCount: 6,
    theoreticalVdcFormula: '3·V_m,LL / π · cos α ≈ 1.35 · V_LL,rms · cos α',
  },
  '3P_SEMI_CONVERTER': {
    id: '3P_SEMI_CONVERTER',
    name: '3-Phase Semi-Controlled Bridge',
    category: '3-Phase',
    shortDesc: '3 SCRs on upper leg + 3 Diodes on lower leg. Cost-effective single-quadrant drive with no negative voltage excursion.',
    switches: '3 SCRs + 3 Diodes',
    pulseCount: 6,
    theoreticalVdcFormula: '3·V_m,LL / (2π) · (1 + cos α)',
  },
  '3P_DIODE_BRIDGE': {
    id: '3P_DIODE_BRIDGE',
    name: '3-Phase Uncontrolled Bridge (6-Pulse)',
    category: '3-Phase',
    shortDesc: '6-diode heavy industrial rectifier bridge. Very low DC voltage ripple (~4.2%), high displacement factor.',
    switches: '6 Diodes (D1–D6)',
    pulseCount: 6,
    theoreticalVdcFormula: '3·V_m,LL / π ≈ 1.35 · V_LL,rms',
  },
};

/**
 * High-precision simulation of rectifier circuit waveforms and performance metrics
 */
export function simulateRectifier(params: CircuitParameters): {
  points: WaveformPoint[];
  metrics: SimulationMetrics;
} {
  const {
    topology,
    loadType,
    vsRms,
    frequency,
    alphaDeg,
    resistance,
    inductanceMh,
    backEmf,
    capacitanceUf,
  } = params;

  // Angular frequency & timing
  const f = Math.max(10, Math.min(400, frequency));
  const omega = 2 * Math.PI * f;
  const T = 1 / f; // Cycle period in seconds
  const alphaRad = (Math.max(0, Math.min(180, alphaDeg)) * Math.PI) / 180;
  const R = Math.max(0.1, resistance);
  const L = Math.max(0, inductanceMh) * 1e-3; // Henry
  const C = Math.max(1, capacitanceUf) * 1e-6; // Farad
  const E = backEmf; // Volts (DC motor back-EMF or battery voltage)

  // Peak voltage calculation
  const is3Phase = topology.startsWith('3P_');
  // For 3-phase, vsRms is Line-to-Line RMS
  const VmLL = is3Phase ? Math.sqrt(2) * vsRms : 0;
  const Vmph = is3Phase ? VmLL / Math.sqrt(3) : Math.sqrt(2) * vsRms;
  const Vm = is3Phase ? Vmph : Math.sqrt(2) * vsRms;

  // Simulation grid: Simulate 4 cycles to settle initial transients, then sample the 2 steady-state cycles
  const totalCycles = 4;
  const displayCycles = 2;
  const stepsPerCycle = 1000;
  const dt = T / stepsPerCycle;
  const totalSteps = totalCycles * stepsPerCycle;

  // State variables for differential equations:
  // io: inductor current (A)
  // vc: capacitor voltage (V, for RC load)
  let io = 0;
  let vc = 0;

  const rawPoints: Array<{
    t: number; // seconds
    omegaT: number;
    vs: number;
    vsB?: number;
    vsC?: number;
    is: number;
    vo: number;
    io: number;
    po: number;
    vDevice: number;
    gatePulse: number;
    conductingState: string;
  }> = [];

  // Device state tracking
  let isT1Conducting = false;
  let isT2Conducting = false;
  let isT3Conducting = false;
  let isT4Conducting = false;
  let isFWDConducting = false;
  let last3PSubinterval = -1;

  for (let step = 0; step < totalSteps; step++) {
    const t = step * dt;
    const omegaT = omega * t;
    const cyclePos = omegaT % (2 * Math.PI); // 0 to 2pi

    // Source voltages
    let vs = Vm * Math.sin(omegaT);
    let vsB = 0;
    let vsC = 0;

    if (is3Phase) {
      vs = Vmph * Math.sin(omegaT);
      vsB = Vmph * Math.sin(omegaT - (2 * Math.PI) / 3);
      vsC = Vmph * Math.sin(omegaT - (4 * Math.PI) / 3);
    }

    // Determine applied voltage vo_applied depending on topology and switch states
    let vo = 0;
    let isCurr = 0;
    let vDevice = 0; // Thyristor T1 voltage
    let gatePulse = 0;
    let conductingState = 'None';

    const gateWidthRad = (3 * Math.PI) / 180; // 3 degree gate pulse width

    // Switch logic per topology
    switch (topology) {
      case '1P_HALF_WAVE': {
        const fire1 = alphaRad;
        const inGateWindow = cyclePos >= fire1 && cyclePos <= fire1 + gateWidthRad;
        if (inGateWindow) gatePulse = 1;

        // Turn on condition: firing angle reached and forward biased (vs > E)
        if (cyclePos >= fire1 && cyclePos < 2 * Math.PI) {
          if (!isT1Conducting && vs > E && inGateWindow) {
            isT1Conducting = true;
          }
        }
        if (cyclePos < fire1) {
          if (io <= 0.0001) isT1Conducting = false;
        }

        // Freewheeling diode check
        if (loadType === 'RL_FWD') {
          if (vs < 0 && io > 0.0001) {
            isFWDConducting = true;
            isT1Conducting = false;
          } else {
            isFWDConducting = false;
          }
        }

        if (isT1Conducting) {
          vo = vs;
          isCurr = io;
          vDevice = 0.8; // Small forward drop
          conductingState = 'SCR T1';
        } else if (isFWDConducting) {
          vo = 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Freewheel Diode';
        } else {
          // Off state
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs - vo;
          conductingState = 'Blocked';
        }
        break;
      }

      case '1P_MID_POINT':
      case '1P_FULL_BRIDGE': {
        const fire1 = alphaRad;
        const fire2 = Math.PI + alphaRad;

        const gate1 = cyclePos >= fire1 && cyclePos <= fire1 + gateWidthRad;
        const gate2 = cyclePos >= fire2 && cyclePos <= fire2 + gateWidthRad;
        if (gate1 || gate2) gatePulse = 1;

        if (gate1 && vs > E) {
          isT1Conducting = true;
          isT2Conducting = false;
        }
        if (gate2 && -vs > E) {
          isT2Conducting = true;
          isT1Conducting = false;
        }

        // Freewheeling diode option
        if (loadType === 'RL_FWD') {
          if (isT1Conducting && vs < 0 && io > 0.0001) {
            isFWDConducting = true;
            isT1Conducting = false;
          } else if (isT2Conducting && -vs < 0 && io > 0.0001) {
            isFWDConducting = true;
            isT2Conducting = false;
          } else if (io <= 0.0001) {
            isFWDConducting = false;
          }
        }

        if (isT1Conducting) {
          vo = vs;
          isCurr = io;
          vDevice = 0.8;
          conductingState = topology === '1P_FULL_BRIDGE' ? 'T1, T2' : 'T1';
        } else if (isT2Conducting) {
          vo = -vs;
          isCurr = -io;
          vDevice = 2 * vs; // Inverse voltage in mid-point or full bridge
          conductingState = topology === '1P_FULL_BRIDGE' ? 'T3, T4' : 'T2';
        } else if (isFWDConducting) {
          vo = 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Freewheel Diode';
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs - vo;
          conductingState = 'Blocked';
        }
        break;
      }

      case '1P_SEMI_CONVERTER': {
        // Semi-converter: Diodes naturally commutate at pi, clamping vo to 0
        const fire1 = alphaRad;
        const fire2 = Math.PI + alphaRad;

        const gate1 = cyclePos >= fire1 && cyclePos <= fire1 + gateWidthRad;
        const gate2 = cyclePos >= fire2 && cyclePos <= fire2 + gateWidthRad;
        if (gate1 || gate2) gatePulse = 1;

        if (gate1 && vs > E) {
          isT1Conducting = true;
          isT2Conducting = false;
          isFWDConducting = false;
        }
        if (gate2 && -vs > E) {
          isT2Conducting = true;
          isT1Conducting = false;
          isFWDConducting = false;
        }

        // Freewheeling action occurs naturally when vs reverses polarity
        if (isT1Conducting && vs < 0) {
          isT1Conducting = false;
          isFWDConducting = io > 0.0001;
        }
        if (isT2Conducting && -vs < 0) {
          isT2Conducting = false;
          isFWDConducting = io > 0.0001;
        }

        if (isT1Conducting) {
          vo = vs;
          isCurr = io;
          vDevice = 0.8;
          conductingState = 'T1, D2';
        } else if (isT2Conducting) {
          vo = -vs;
          isCurr = -io;
          vDevice = vs;
          conductingState = 'T2, D1';
        } else if (isFWDConducting) {
          vo = 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Freewheeling (D1, D2)';
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Blocked';
        }
        break;
      }

      case '1P_DIODE_BRIDGE': {
        gatePulse = 0; // Uncontrolled
        if (vs > E) {
          vo = vs;
          isCurr = io;
          vDevice = 0.7;
          conductingState = 'D1, D2';
        } else if (-vs > E) {
          vo = -vs;
          isCurr = -io;
          vDevice = vs;
          conductingState = 'D3, D4';
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs - vo;
          conductingState = 'Blocked';
        }
        break;
      }

      case '3P_HALF_WAVE': {
        // Natural crossover starts at 30 deg (pi/6)
        const refAngle = Math.PI / 6;
        const fireA = refAngle + alphaRad;
        const fireB = refAngle + (2 * Math.PI) / 3 + alphaRad;
        const fireC = refAngle + (4 * Math.PI) / 3 + alphaRad;

        const gateA = cyclePos >= fireA && cyclePos <= fireA + gateWidthRad;
        const gateB = cyclePos >= fireB && cyclePos <= fireB + gateWidthRad;
        const gateC = cyclePos >= fireC && cyclePos <= fireC + gateWidthRad;
        if (gateA || gateB || gateC) gatePulse = 1;

        if (gateA && vs > E) {
          isT1Conducting = true;
          isT2Conducting = false;
          isT3Conducting = false;
        }
        if (gateB && vsB > E) {
          isT1Conducting = false;
          isT2Conducting = true;
          isT3Conducting = false;
        }
        if (gateC && vsC > E) {
          isT1Conducting = false;
          isT2Conducting = false;
          isT3Conducting = true;
        }

        if (isT1Conducting) {
          vo = vs;
          isCurr = io;
          vDevice = 0.8;
          conductingState = 'SCR T1 (Phase A)';
        } else if (isT2Conducting) {
          vo = vsB;
          isCurr = 0;
          vDevice = vs - vsB;
          conductingState = 'SCR T2 (Phase B)';
        } else if (isT3Conducting) {
          vo = vsC;
          isCurr = 0;
          vDevice = vs - vsC;
          conductingState = 'SCR T3 (Phase C)';
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs - vo;
          conductingState = 'Blocked';
        }
        break;
      }

      case '3P_FULL_BRIDGE': {
        // 6-Pulse Graetz bridge line voltages:
        // vab = van - vbn
        // vac = van - vcn
        // vbc = vbn - vcn
        // vba = -vab
        // vca = -vac
        // vcb = -vbc
        const vab = vs - vsB;
        const vac = vs - vsC;
        const vbc = vsB - vsC;
        const vba = -vab;
        const vca = -vac;
        const vcb = -vbc;

        // Firing sequence spaced by 60 degrees (pi/3) starting at 30 deg + alpha
        const subintervals = [
          { start: Math.PI / 6 + alphaRad, v: vab, state: 'T1, T6 (v_ab)', iSignA: 1 },
          { start: Math.PI / 2 + alphaRad, v: vac, state: 'T1, T2 (v_ac)', iSignA: 1 },
          { start: (5 * Math.PI) / 6 + alphaRad, v: vbc, state: 'T3, T2 (v_bc)', iSignA: 0 },
          { start: (7 * Math.PI) / 6 + alphaRad, v: vba, state: 'T3, T4 (v_ba)', iSignA: -1 },
          { start: (9 * Math.PI) / 6 + alphaRad, v: vca, state: 'T5, T4 (v_ca)', iSignA: -1 },
          { start: (11 * Math.PI) / 6 + alphaRad, v: vcb, state: 'T5, T6 (v_cb)', iSignA: 0 },
        ];

        // Find which subinterval we are in
        let activeIdx = 5;
        for (let i = 0; i < subintervals.length; i++) {
          const s = subintervals[i];
          const nextStart = i === subintervals.length - 1 ? subintervals[0].start + 2 * Math.PI : subintervals[i + 1].start;
          let testCyclePos = cyclePos;
          if (testCyclePos < subintervals[0].start) testCyclePos += 2 * Math.PI;

          if (testCyclePos >= s.start && testCyclePos < nextStart) {
            activeIdx = i;
            if (testCyclePos <= s.start + gateWidthRad) gatePulse = 1;
            break;
          }
        }

        const activeSub = subintervals[activeIdx];
        if (io > 0.0001 || activeSub.v > E) {
          vo = activeSub.v;
          isCurr = activeSub.iSignA * io;
          vDevice = activeIdx === 0 || activeIdx === 1 ? 0.8 : vs - (activeSub.v === vab ? vsB : vsC);
          conductingState = activeSub.state;
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs - vo;
          conductingState = 'Blocked';
        }
        break;
      }

      case '3P_SEMI_CONVERTER': {
        // Semi-controlled 3-phase: 3 SCRs + 3 Diodes
        const vab = vs - vsB;
        const vac = vs - vsC;
        const vbc = vsB - vsC;
        const vba = -vab;
        const vca = -vac;
        const vcb = -vbc;

        const maxLine = Math.max(vab, vac, vbc, vba, vca, vcb);
        const subintervals = [
          { start: Math.PI / 6 + alphaRad, v: vab, state: 'T1, D6 (v_ab)', iSignA: 1 },
          { start: Math.PI / 2 + alphaRad, v: vac, state: 'T1, D2 (v_ac)', iSignA: 1 },
          { start: (5 * Math.PI) / 6 + alphaRad, v: vbc, state: 'T3, D2 (v_bc)', iSignA: 0 },
          { start: (7 * Math.PI) / 6 + alphaRad, v: vba, state: 'T3, D4 (v_ba)', iSignA: -1 },
          { start: (9 * Math.PI) / 6 + alphaRad, v: vca, state: 'T5, D4 (v_ca)', iSignA: -1 },
          { start: (11 * Math.PI) / 6 + alphaRad, v: vcb, state: 'T5, D6 (v_cb)', iSignA: 0 },
        ];

        let activeIdx = 5;
        for (let i = 0; i < subintervals.length; i++) {
          const s = subintervals[i];
          const nextStart = i === subintervals.length - 1 ? subintervals[0].start + 2 * Math.PI : subintervals[i + 1].start;
          let testCyclePos = cyclePos;
          if (testCyclePos < subintervals[0].start) testCyclePos += 2 * Math.PI;

          if (testCyclePos >= s.start && testCyclePos < nextStart) {
            activeIdx = i;
            if (testCyclePos <= s.start + gateWidthRad) gatePulse = 1;
            break;
          }
        }

        const activeSub = subintervals[activeIdx];
        // Semi-converter cannot output negative voltage due to diode freewheeling
        if (activeSub.v < 0 && io > 0.0001) {
          vo = 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Freewheel (Diodes)';
        } else if (io > 0.0001 || activeSub.v > E) {
          vo = Math.max(0, activeSub.v);
          isCurr = activeSub.iSignA * io;
          vDevice = activeIdx <= 1 ? 0.8 : vs;
          conductingState = activeSub.state;
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          vDevice = vs;
          conductingState = 'Blocked';
        }
        break;
      }

      case '3P_DIODE_BRIDGE': {
        const vab = vs - vsB;
        const vac = vs - vsC;
        const vbc = vsB - vsC;
        const vba = -vab;
        const vca = -vac;
        const vcb = -vbc;

        // Largest line-to-line voltage naturally conducts
        const lineVoltages = [
          { val: vab, state: 'D1, D6 (v_ab)', iSignA: 1 },
          { val: vac, state: 'D1, D2 (v_ac)', iSignA: 1 },
          { val: vbc, state: 'D3, D2 (v_bc)', iSignA: 0 },
          { val: vba, state: 'D3, D4 (v_ba)', iSignA: -1 },
          { val: vca, state: 'D5, D4 (v_ca)', iSignA: -1 },
          { val: vcb, state: 'D5, D6 (v_cb)', iSignA: 0 },
        ];

        let maxL = lineVoltages[0];
        for (const l of lineVoltages) {
          if (l.val > maxL.val) maxL = l;
        }

        if (maxL.val > E) {
          vo = maxL.val;
          isCurr = maxL.iSignA * io;
          conductingState = maxL.state;
          vDevice = maxL.iSignA === 1 ? 0.7 : vs - vsB;
        } else {
          vo = loadType === 'RLE' ? E : 0;
          isCurr = 0;
          conductingState = 'Blocked';
          vDevice = vs - vo;
        }
        break;
      }
    }

    // Load differential dynamics:
    // Case 1: Pure R
    if (loadType === 'R') {
      io = Math.max(0, vo / R);
      if (io <= 0.0001 && conductingState.includes('SCR')) {
        isT1Conducting = false;
        isT2Conducting = false;
      }
    }
    // Case 2: Highly Inductive (L -> infinity, smooth constant ripple-free DC current)
    else if (loadType === 'HIGH_L') {
      // Steady-state average voltage drives constant DC current
      // Approximate ideal current based on circuit impedance
      const theoreticalVdc = calculateTheoreticalVdc(topology, Vm, VmLL, alphaRad);
      const targetIdc = Math.max(0, (theoreticalVdc - E) / R);
      io = targetIdc;
    }
    // Case 3: RC Load (filter capacitor)
    else if (loadType === 'RC') {
      // Diode rectifier with capacitor:
      // When vo > vc, diodes charge capacitor: vc = vo, io = vc/R + C*dvo/dt
      // When vo < vc, capacitor discharges through R: dvc/dt = -vc/(R*C)
      if (vo > vc) {
        vc = vo;
        io = vc / R;
      } else {
        vc = vc * Math.exp(-dt / (R * C));
        vo = vc;
        io = vc / R;
        isCurr = 0;
        conductingState = 'Discharging Filter C';
      }
    }
    // Case 4: RL and RLE load (Numerical Runge-Kutta 2 integration for L*di/dt + R*i + E = vo)
    else {
      // Differential equation: di/dt = (vo - R*io - E) / L
      if (L > 0) {
        const didt1 = (vo - R * io - E) / L;
        const ioMid = Math.max(0, io + 0.5 * dt * didt1);
        const didt2 = (vo - R * ioMid - E) / L;
        io = Math.max(0, io + dt * didt2);

        // Turn off thyristors when current drops to zero
        if (io <= 0.0001) {
          io = 0;
          isT1Conducting = false;
          isT2Conducting = false;
          isT3Conducting = false;
          isFWDConducting = false;
        }
      } else {
        io = Math.max(0, (vo - E) / R);
      }
    }

    // Instantaneous power
    const po = vo * io;

    // Collect points from the last `displayCycles` cycles
    const startStep = (totalCycles - displayCycles) * stepsPerCycle;
    if (step >= startStep) {
      const displayT = (t - (totalCycles - displayCycles) * T) * 1000; // ms
      const displayOmegaT = omega * (t - (totalCycles - displayCycles) * T);
      rawPoints.push({
        t: displayT,
        omegaT: displayOmegaT,
        vs,
        vsB,
        vsC,
        is: isCurr,
        vo,
        io,
        po,
        vDevice,
        gatePulse,
        conductingState,
      });
    }
  }

  // Downsample to clean display points (e.g. 1000 points total)
  const stepStride = Math.max(1, Math.floor(rawPoints.length / 1000));
  const points: WaveformPoint[] = [];
  for (let i = 0; i < rawPoints.length; i += stepStride) {
    const p = rawPoints[i];
    points.push({
      t: Number(p.t.toFixed(3)),
      omegaT: p.omegaT,
      omegaTDeg: Number(((p.omegaT * 180) / Math.PI).toFixed(1)),
      vs: Number(p.vs.toFixed(2)),
      vsB: p.vsB !== undefined ? Number(p.vsB.toFixed(2)) : undefined,
      vsC: p.vsC !== undefined ? Number(p.vsC.toFixed(2)) : undefined,
      is: Number(p.is.toFixed(2)),
      vo: Number(p.vo.toFixed(2)),
      io: Number(p.io.toFixed(2)),
      po: Number(p.po.toFixed(2)),
      vDevice: Number(p.vDevice.toFixed(2)),
      gatePulse: p.gatePulse,
      conductingState: p.conductingState,
    });
  }

  // Compute precise metrics across exactly 1 complete steady-state cycle
  const oneCyclePoints = rawPoints.slice(0, stepsPerCycle);
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumPo = 0;
  let sumIsSq = 0;
  let sumPin = 0;
  let minVo = Infinity;
  let maxVo = -Infinity;
  let minIo = Infinity;
  let maxIo = -Infinity;
  let maxPiv = 0;

  for (const pt of oneCyclePoints) {
    sumVo += pt.vo;
    sumVoSq += pt.vo * pt.vo;
    sumIo += pt.io;
    sumIoSq += pt.io * pt.io;
    sumPo += pt.po;
    sumIsSq += pt.is * pt.is;
    sumPin += pt.vs * pt.is;

    if (pt.vo < minVo) minVo = pt.vo;
    if (pt.vo > maxVo) maxVo = pt.vo;
    if (pt.io < minIo) minIo = pt.io;
    if (pt.io > maxIo) maxIo = pt.io;

    // Peak inverse voltage is max negative voltage across switch
    if (-pt.vDevice > maxPiv) maxPiv = -pt.vDevice;
  }

  const N = oneCyclePoints.length;
  const vdc = sumVo / N;
  const vorms = Math.sqrt(Math.max(0, sumVoSq / N));
  const idc = sumIo / N;
  const iorms = Math.sqrt(Math.max(0, sumIoSq / N));
  const pdc = vdc * idc;
  const pac = sumPo / N;
  const isRms = Math.sqrt(Math.max(0, sumIsSq / N));

  const formFactor = vdc > 0.01 ? vorms / vdc : 1;
  const rippleFactor = formFactor >= 1 ? Math.sqrt(Math.max(0, formFactor * formFactor - 1)) : 0;
  const efficiency = pac > 0.01 ? Math.min(100, Math.max(0, (pdc / pac) * 100)) : 0;

  const apparentPowerIn = vsRms * isRms;
  const activePowerIn = Math.max(0, sumPin / N);
  const powerFactor = apparentPowerIn > 0.1 ? Math.min(1, Math.max(0, activePowerIn / apparentPowerIn)) : 0.9;
  const displacementFactor = Math.abs(Math.cos(alphaRad));

  // Determine continuous vs discontinuous conduction
  // If current touches zero for more than 5% of cycle, it's discontinuous
  let zeroCurrentCount = 0;
  let extinctionAngleDeg = 180;
  for (let i = 0; i < oneCyclePoints.length; i++) {
    const pt = oneCyclePoints[i];
    if (pt.io <= 0.001) {
      zeroCurrentCount++;
      if (extinctionAngleDeg === 180 && pt.omegaT > alphaRad) {
        extinctionAngleDeg = (pt.omegaT * 180) / Math.PI;
      }
    }
  }

  const isDCM = zeroCurrentCount > 0.03 * N && loadType !== 'HIGH_L';
  const conductionMode = isDCM ? 'DCM' : 'CCM';
  const conductionAngleDeg = isDCM
    ? Math.max(0, extinctionAngleDeg - alphaDeg)
    : 180;

  // Discrete Fourier Transform for output voltage harmonics
  const harmonics: HarmonicComponent[] = [];
  const maxOrder = is3Phase ? 18 : 12;
  const fundamentalStep = is3Phase ? 3 : (topology === '1P_HALF_WAVE' ? 1 : 2);

  // Compute DC component
  harmonics.push({
    order: 0,
    frequencyHz: 0,
    amplitude: Number(vdc.toFixed(1)),
    percentageOfDc: 100,
  });

  let sumHarmonicSq = 0;

  for (let n = 1; n <= maxOrder; n++) {
    let an = 0;
    let bn = 0;
    for (const pt of oneCyclePoints) {
      an += pt.vo * Math.cos(n * pt.omegaT);
      bn += pt.vo * Math.sin(n * pt.omegaT);
    }
    an = (2 / N) * an;
    bn = (2 / N) * bn;
    const peakAmp = Math.sqrt(an * an + bn * bn);
    const rmsAmp = peakAmp / Math.SQRT2;

    if (n % fundamentalStep === 0 || n <= 4) {
      harmonics.push({
        order: n,
        frequencyHz: n * f,
        amplitude: Number(rmsAmp.toFixed(2)),
        percentageOfDc: vdc > 0.1 ? Number(((rmsAmp / vdc) * 100).toFixed(1)) : 0,
      });
      if (n > 0) {
        sumHarmonicSq += rmsAmp * rmsAmp;
      }
    }
  }

  // THD current estimation
  const thdCurrent = isRms > 0.1 ? Math.min(150, Math.max(4, Math.sqrt(sumHarmonicSq) / (idc || 1) * 10)) : 12;

  const metrics: SimulationMetrics = {
    vdc: Number(vdc.toFixed(2)),
    vorms: Number(vorms.toFixed(2)),
    idc: Number(idc.toFixed(2)),
    iorms: Number(iorms.toFixed(2)),
    pdc: Number(pdc.toFixed(2)),
    pac: Number(pac.toFixed(2)),
    efficiency: Number(efficiency.toFixed(1)),
    formFactor: Number(formFactor.toFixed(3)),
    rippleFactor: Number(rippleFactor.toFixed(3)),
    voltageRipplePkPk: Number((maxVo - minVo).toFixed(2)),
    currentRipplePkPk: Number((maxIo - minIo).toFixed(2)),
    thdCurrent: Number(thdCurrent.toFixed(1)),
    powerFactor: Number(powerFactor.toFixed(3)),
    displacementFactor: Number(displacementFactor.toFixed(3)),
    pivDevice: Number(maxPiv > 0 ? maxPiv.toFixed(1) : (is3Phase ? VmLL : 2 * Vm).toFixed(1)),
    conductionMode,
    extinctionAngleDeg: Number((extinctionAngleDeg % 360).toFixed(1)),
    conductionAngleDeg: Number(conductionAngleDeg.toFixed(1)),
    harmonics,
  };

  return { points, metrics };
}

/**
 * Theoretical Vdc formula calculator for standard reference
 */
function calculateTheoreticalVdc(
  topology: TopologyType,
  Vm: number,
  VmLL: number,
  alphaRad: number
): number {
  switch (topology) {
    case '1P_HALF_WAVE':
      return (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
    case '1P_MID_POINT':
    case '1P_FULL_BRIDGE':
      return ((2 * Vm) / Math.PI) * Math.cos(alphaRad);
    case '1P_SEMI_CONVERTER':
      return (Vm / Math.PI) * (1 + Math.cos(alphaRad));
    case '1P_DIODE_BRIDGE':
      return (2 * Vm) / Math.PI;
    case '3P_HALF_WAVE':
      return ((3 * Math.sqrt(3) * Vm) / (2 * Math.PI)) * Math.cos(alphaRad);
    case '3P_FULL_BRIDGE':
      return ((3 * VmLL) / Math.PI) * Math.cos(alphaRad);
    case '3P_SEMI_CONVERTER':
      return ((3 * VmLL) / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
    case '3P_DIODE_BRIDGE':
      return (3 * VmLL) / Math.PI;
    default:
      return (2 * Vm) / Math.PI;
  }
}
