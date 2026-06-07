// ── seeded PRNG ────────────────────────────────────────────────────
function makePrng(seed: number) {
  let s = (seed | 0) || 1;
  return (): number => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 11;
    s = Math.imul(s ^ (s >>> 7), 0xc4ceb9fe);
    s ^= s >>> 16;
    return (s >>> 0) / 0x100000000;
  };
}

function gauss(rng: () => number): number {
  const u = Math.max(1e-10, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── 1D Morlet kernel ───────────────────────────────────────────────
function morletKernel1D(
  omega0: number,
  sigma: number,
  half: number
): { re: number[]; im: number[] } {
  const len = 2 * half + 1;
  const re = new Array<number>(len);
  const im = new Array<number>(len);
  let normSq = 0;
  for (let t = -half; t <= half; t++) {
    const g = Math.exp((-t * t) / (2 * sigma * sigma));
    re[t + half] = Math.cos(omega0 * t) * g;
    im[t + half] = Math.sin(omega0 * t) * g;
    normSq += g * g;
  }
  const inv = 1 / Math.sqrt(normSq);
  for (let i = 0; i < len; i++) { re[i] *= inv; im[i] *= inv; }
  return { re, im };
}

// ── 1D complex convolution → modulus ──────────────────────────────
function convolveModulus(
  sig: number[],
  re: number[],
  im: number[]
): number[] {
  const N = sig.length;
  const M = re.length;
  const half = (M - 1) >> 1;
  const out = new Array<number>(N);
  for (let t = 0; t < N; t++) {
    let rAcc = 0, iAcc = 0;
    for (let k = 0; k < M; k++) {
      const idx = ((t - k + half) % N + N) % N;
      rAcc += sig[idx] * re[k];
      iAcc += sig[idx] * im[k];
    }
    out[t] = Math.sqrt(rAcc * rAcc + iAcc * iAcc);
  }
  return out;
}

function boxAvg(sig: number[], period: number): number {
  const step = Math.max(1, Math.floor(sig.length / period));
  let sum = 0, count = 0;
  for (let t = 0; t < sig.length; t += step) { sum += sig[t]; count++; }
  return sum / count;
}

// ── CHIRP SIGNAL ───────────────────────────────────────────────────
export function generateChirp(N = 256): number[] {
  const out: number[] = [];
  for (let t = 0; t < N; t++) {
    const w = Math.sin(Math.PI * t / N);
    const phase = 2 * Math.PI * (0.02 + 0.08 * t / N) * t;
    out.push(Math.sin(phase) * w);
  }
  return out;
}

// ── 1-D SCATTERING (J=4) ──────────────────────────────────────────
export interface ScatteringData {
  signal: number[];
  scalogram: number[][];   // J × T_down
  s1: number[];            // length J
  s2: number[][];          // J × J (upper triangular, j2 > j1)
  s2flat: number[];
}

export function computeScattering(signal: number[]): ScatteringData {
  const J = 4;
  const N = signal.length;
  const T_down = 64;
  const omega0 = (3 * Math.PI) / 4;
  const scalogram: number[][] = [];
  const s1: number[] = [];
  const U1: number[][] = [];

  for (let j = 0; j < J; j++) {
    const sigma = Math.pow(2, j) * 2;
    const half = Math.min(Math.floor(3 * sigma), 120);
    const { re, im } = morletKernel1D(omega0 / Math.pow(2, j), sigma, half);
    const u1 = convolveModulus(signal, re, im);
    U1.push(u1);
    scalogram.push(
      Array.from({ length: T_down }, (_, k) => u1[Math.floor((k * N) / T_down)])
    );
    s1.push(boxAvg(u1, 16));
  }

  const s2: number[][] = Array.from({ length: J }, () => new Array<number>(J).fill(0));
  const s2flat: number[] = [];

  for (let j1 = 0; j1 < J; j1++) {
    for (let j2 = j1 + 1; j2 < J; j2++) {
      const sigma2 = Math.pow(2, j2) * 2;
      const half2 = Math.min(Math.floor(3 * sigma2), 120);
      const { re, im } = morletKernel1D(omega0 / Math.pow(2, j2), sigma2, half2);
      const v = boxAvg(convolveModulus(U1[j1], re, im), 16);
      s2[j1][j2] = v;
      s2flat.push(v);
    }
  }

  return { signal, scalogram, s1, s2, s2flat };
}

// ── 2D ORIENTED MORLET (for WaveletFilterBank) ────────────────────
export function morlet2D(j: number, theta: number, size = 16): number[][] {
  const sigma = Math.pow(2, j) * 1.4;
  const xi = (Math.PI * 0.75) / Math.pow(2, j);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const range = sigma * 3.5;
  const grid: number[][] = [];
  for (let py = 0; py < size; py++) {
    const row: number[] = [];
    for (let px = 0; px < size; px++) {
      const u = ((px / (size - 1)) - 0.5) * range * 2;
      const v = ((py / (size - 1)) - 0.5) * range * 2;
      const xr = u * cosT + v * sinT;
      const yr = -u * sinT + v * cosT;
      const g = Math.exp(-(xr * xr + yr * yr) / (2 * sigma * sigma));
      row.push(g * Math.cos(xi * xr));
    }
    grid.push(row);
  }
  return grid;
}

// ── DEFORMATION STABILITY ─────────────────────────────────────────
export interface DeformationData {
  clean: number[];
  deformed: number[];
  scatClean: number[];
  scatDeformed: number[];
  relErr: number;
}

export function generateDeformationData(tauAmp: number, N = 128): DeformationData {
  const clean: number[] = [];
  for (let t = 0; t < N; t++) {
    const tt = t / N;
    const w = Math.sin(Math.PI * tt);
    clean.push(
      (Math.sin(2 * Math.PI * 3 * tt) + 0.4 * Math.sin(2 * Math.PI * 7 * tt)) * w
    );
  }

  const deformed: number[] = [];
  for (let t = 0; t < N; t++) {
    const tau = tauAmp * Math.sin(2 * Math.PI * 0.7 * (t / N)) * N * 0.3;
    const s = Math.max(0, Math.min(N - 1, t - tau));
    const fl = Math.floor(s);
    const fr = Math.min(N - 1, fl + 1);
    deformed.push(clean[fl] * (1 - (s - fl)) + clean[fr] * (s - fl));
  }

  const J = 5;
  const omega0 = (3 * Math.PI) / 4;
  const scatClean: number[] = [];
  const scatDeformed: number[] = [];

  for (let j = 0; j < J; j++) {
    const sigma = Math.pow(2, j) * 1.5;
    const half = Math.min(Math.floor(3 * sigma), 60);
    const { re, im } = morletKernel1D(omega0 / Math.pow(2, j), sigma, half);
    scatClean.push(boxAvg(convolveModulus(clean, re, im), 8));
    scatDeformed.push(boxAvg(convolveModulus(deformed, re, im), 8));
  }

  const normSq = clean.reduce((s, x) => s + x * x, 0);
  let errSq = 0;
  for (let i = 0; i < J; i++) errSq += (scatClean[i] - scatDeformed[i]) ** 2;
  const relErr = Math.sqrt(errSq / Math.max(normSq * 0.01, 1e-9));

  return { clean, deformed, scatClean, scatDeformed, relErr };
}

// ── R2 SCATTER DATA ────────────────────────────────────────────────
export interface R2Event { m: number; r2: number; s1: number; }

export function generateR2Data(): { signal: R2Event[]; background: R2Event[] } {
  const rng = makePrng(42);
  const bg: R2Event[] = [];
  const sig: R2Event[] = [];

  for (let i = 0; i < 220; i++) {
    const m = 500 + (-Math.log(Math.max(1e-10, rng())) * 550) % 2500;
    const r2 = Math.max(0.05, Math.min(0.95, 0.30 + gauss(rng) * 0.06));
    const s1 = Math.max(0, 0.085 * Math.sqrt(m) + gauss(rng) * 4);
    bg.push({ m, r2, s1 });
  }
  for (let i = 0; i < 90; i++) {
    const m = Math.max(500, 1200 + gauss(rng) * 65);
    const r2 = Math.max(0.05, Math.min(0.95, 0.64 + gauss(rng) * 0.07));
    const s1 = Math.max(0, 0.085 * Math.sqrt(m) + gauss(rng) * 4);
    sig.push({ m, r2, s1 });
  }
  return { signal: sig, background: bg };
}

// ── MASS-SCULPTING EVENTS ─────────────────────────────────────────
export const M_MIN = 500;
export const M_MAX = 3000;
export const N_BINS = 50;
export const BIN_W = (M_MAX - M_MIN) / N_BINS;

export interface MassEvent {
  m: number;
  massBin: number;
  noise: number;
  isSignal: boolean;
}

export function generateMassEvents(nBg = 20000, nSig = 2000): MassEvent[] {
  const rng = makePrng(2026);
  const events: MassEvent[] = [];

  // Background: exponentially declining mass
  for (let i = 0; i < nBg; i++) {
    const m = Math.min(M_MAX, M_MIN - 600 * Math.log(Math.max(1e-10, rng())));
    const noise = gauss(rng);
    const massBin = Math.max(0, Math.min(N_BINS - 1, Math.floor((m - M_MIN) / BIN_W)));
    events.push({ m, massBin, noise, isSignal: false });
  }

  // Signal: Gaussian bump at 1200 GeV
  for (let i = 0; i < nSig; i++) {
    const m = Math.max(M_MIN, Math.min(M_MAX, 1200 + gauss(rng) * 50));
    const noise = gauss(rng);
    const massBin = Math.max(0, Math.min(N_BINS - 1, Math.floor((m - M_MIN) / BIN_W)));
    events.push({ m, massBin, noise, isSignal: true });
  }

  return events;
}

// ── ANOMALY EMBEDDING ─────────────────────────────────────────────
export interface AnomalyPoint { x: number; y: number; dist: number; }

export function generateAnomalyData(): {
  background: AnomalyPoint[];
  signal: AnomalyPoint[];
} {
  const rng = makePrng(137);
  const background: AnomalyPoint[] = [];
  const signal: AnomalyPoint[] = [];

  for (let i = 0; i < 320; i++) {
    const x = gauss(rng) * 0.9 + gauss(rng) * 0.1;
    const y = gauss(rng) * 0.9 + gauss(rng) * 0.1;
    background.push({ x, y, dist: Math.sqrt(x * x + y * y) });
  }
  for (let i = 0; i < 80; i++) {
    const angle = rng() * 2 * Math.PI;
    const r = 1.8 + rng() * 2.2;
    const x = r * Math.cos(angle) + gauss(rng) * 0.25;
    const y = r * Math.sin(angle) + gauss(rng) * 0.25;
    signal.push({ x, y, dist: Math.sqrt(x * x + y * y) });
  }
  return { background, signal };
}
