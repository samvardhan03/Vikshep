import { generateMassEvents, MassEvent, N_BINS } from "./synthetic";

// Score: neural network tagger (mass-correlated: higher noise → higher score)
function scoreNN(ev: MassEvent): number {
  const base = ev.isSignal ? 0.72 : 0.28;
  return Math.max(0, Math.min(1, base + ev.noise * 0.18));
}

// Score: Vikshep r2-style tagger (lambda controls DisCo mass decorrelation)
function scoreVS(ev: MassEvent, lambda: number): number {
  const base = ev.isSignal ? 0.70 : 0.30;
  // Mass bias term: signal bump at massBin ~14 (1200 GeV), bkg peaks at low mass
  const massBias = ev.isSignal
    ? 0.12 * Math.exp(-((ev.massBin - 14) ** 2) / 18)
    : -0.08 * Math.exp(-ev.massBin / 12);
  // DisCo penalty suppresses mass correlation as lambda increases
  const decorr = base + massBias * Math.max(0, 1 - lambda * 1.5);
  return Math.max(0, Math.min(1, decorr + ev.noise * 0.16));
}

// JSD between two normalized histograms (length N_BINS each)
function jsd(p: number[], q: number[]): number {
  const n = p.length;
  let val = 0;
  for (let i = 0; i < n; i++) {
    const pi = p[i] + 1e-12;
    const qi = q[i] + 1e-12;
    const m = 0.5 * (pi + qi);
    val += 0.5 * pi * Math.log(pi / m) + 0.5 * qi * Math.log(qi / m);
  }
  return Math.max(0, val);
}

function normalize(hist: number[]): number[] {
  const sum = hist.reduce((a, b) => a + b, 0);
  return sum > 0 ? hist.map((v) => v / sum) : hist.map(() => 1 / hist.length);
}

// ROC AUC via trapezoid rule
function rocAUC(scores: { score: number; label: boolean }[]): number {
  const sorted = [...scores].sort((a, b) => b.score - a.score);
  const nPos = scores.filter((s) => s.label).length;
  const nNeg = scores.length - nPos;
  if (nPos === 0 || nNeg === 0) return 0.5;

  let tp = 0, fp = 0, auc = 0;
  let prevTp = 0, prevFp = 0;

  for (const s of sorted) {
    if (s.label) tp++;
    else fp++;
    const tpr = tp / nPos;
    const fpr = fp / nNeg;
    const prevTpr = prevTp / nPos;
    const prevFpr = prevFp / nNeg;
    auc += (fpr - prevFpr) * (tpr + prevTpr) * 0.5;
    prevTp = tp;
    prevFp = fp;
  }
  return auc;
}

export interface MetricsResult {
  preCutHist: number[];   // background mass hist before cut (normalized)
  postCutHist: number[];  // background mass hist after cut (normalized)
  auc: number;
  jsdVal: number;
}

let _events: MassEvent[] | null = null;
function getEvents(): MassEvent[] {
  if (!_events) _events = generateMassEvents();
  return _events;
}

export function computeMetrics(
  mode: "nn" | "vs",
  cutScore: number,   // 0..1 classifier threshold
  lambda: number      // 0..1 DisCo weight (only used for "vs")
): MetricsResult {
  const events = getEvents();

  // Pre-cut background histogram
  const preCutHist = new Array<number>(N_BINS).fill(0);
  const postCutHist = new Array<number>(N_BINS).fill(0);
  const rocPoints: { score: number; label: boolean }[] = [];

  for (const ev of events) {
    const sc = mode === "nn" ? scoreNN(ev) : scoreVS(ev, lambda);
    rocPoints.push({ score: sc, label: ev.isSignal });

    if (!ev.isSignal) {
      preCutHist[ev.massBin]++;
      if (sc > cutScore) postCutHist[ev.massBin]++;
    }
  }

  const auc = rocAUC(rocPoints);
  const jsdVal = jsd(normalize(preCutHist), normalize(postCutHist));

  return {
    preCutHist: normalize(preCutHist),
    postCutHist: normalize(postCutHist),
    auc,
    jsdVal,
  };
}
