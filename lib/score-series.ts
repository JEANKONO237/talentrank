// Deterministic synthetic score series — server-callable.
// Used for the talent dashboard sparkline while real history isn't connected.

export function buildScoreSeries(current: number, days: number = 30): number[] {
  const out: number[] = new Array(days);
  let v = current;
  const seedBase = Math.floor(current);
  for (let i = days - 1; i >= 0; i--) {
    out[i] = Math.max(0, Math.min(100, Math.round(v)));
    // Deterministic pseudo-random in [0,1)
    const pseudo = ((Math.sin(seedBase * 0.31 + i * 1.7) + 1) / 2) % 1;
    const drift = pseudo - 0.55; // slight negative bias — past is lower than now
    v = v - drift * 0.9;
  }
  return out;
}
