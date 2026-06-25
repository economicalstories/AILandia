// ---------------------------------------------------------------------------
// Seedable, deterministic pseudo-random number generator.
//
// We use a small, well-known PRNG (mulberry32) seeded via a string hash
// (xmur3). Given the same seed string the sequence is identical on every
// machine and every run, which is what makes AILandia runs reproducible.
// ---------------------------------------------------------------------------

// xmur3: turn a string seed into a 32-bit integer seed for the generator.
function xmur3(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    h ^= h >>> 16
    return h >>> 0
  }
}

// mulberry32: fast 32-bit PRNG, returns floats in [0, 1).
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Public factory. Returns an object with helper sampling methods so callers
// never touch Math.random (which would break determinism).
export function makeRng(seedString) {
  const seedFn = xmur3(String(seedString))
  const next = mulberry32(seedFn())
  return {
    // Uniform float in [0, 1).
    float: () => next(),
    // Uniform float in [min, max).
    range: (min, max) => min + (max - min) * next(),
    // Integer in [min, max] inclusive.
    int: (min, max) => Math.floor(min + (max - min + 1) * next()),
    // Approximately-normal sample (sum of 3 uniforms), mean 0, ~unit spread.
    normal: () => (next() + next() + next() - 1.5) * 1.1547,
    // True with probability p.
    chance: (p) => next() < p,
    // Pick a random element of an array.
    pick: (arr) => arr[Math.floor(next() * arr.length)],
  }
}
