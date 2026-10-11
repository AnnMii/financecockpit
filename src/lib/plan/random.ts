/**
 * Reproducible random numbers: the same seed gives the same sequence, so the
 * same plan always shows the same corridor.
 */

/** Uniform numbers in [0, 1) (mulberry32). */
export function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal numbers (Box–Muller). */
export function createNormal(seed: number): () => number {
  const random = createRandom(seed);
  return () => {
    const u = 1 - random();
    const v = random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/**
 * The value below which the share `p` of the sorted values lies, e.g. p = 0.1
 * for the pessimistic end. `sorted` must be ascending.
 */
export function quantile(sorted: ArrayLike<number>, p: number): number {
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(p * sorted.length) - 1),
  );
  return sorted[index];
}
