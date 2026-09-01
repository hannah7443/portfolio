// Lightweight, dependency-free value-noise / fbm helper for terrain displacement
// and flower placement. Not cryptographically anything — just cheap, deterministic,
// and smooth enough for rolling-hill silhouettes.

function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function valueNoise2D(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const tl = hash(xi, yi);
  const tr = hash(xi + 1, yi);
  const bl = hash(xi, yi + 1);
  const br = hash(xi + 1, yi + 1);

  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const top = tl + (tr - tl) * u;
  const bottom = bl + (br - bl) * u;
  return top + (bottom - top) * v;
}

/** Fractal Brownian motion: layered value noise, returns roughly [0, 1]. */
export function fbm2D(x: number, y: number, octaves = 3): number {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += valueNoise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }

  return total / maxValue;
}
