import * as THREE from "three";

// Procedural grass-blade texture, generated once on a canvas and tiled across
// the terrain via UV repeat. Vertex colors (see Terrain.tsx) supply the broad
// hill gradient; this texture supplies the blade-scale grain that a ~0.5-unit
// vertex spacing can't render on its own.

const TILE_PX = 256;

function rand(seed: () => number, min: number, max: number) {
  return min + seed() * (max - min);
}

// Deterministic PRNG so the texture is stable across re-renders (mulberry32).
function makeRng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_PX;
  canvas.height = TILE_PX;
  const ctx = canvas.getContext("2d")!;
  const rng = makeRng(1337);

  // Base fill: dark grass green.
  ctx.fillStyle = "#1c3a1e";
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);

  // Soft blotchy patches (clumps of lighter/darker grass) drawn first so blade
  // strokes layer on top of them.
  for (let i = 0; i < 22; i++) {
    const x = rand(rng, 0, TILE_PX);
    const y = rand(rng, 0, TILE_PX);
    const r = rand(rng, 20, 55);
    const lighter = rng() > 0.5;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, lighter ? "rgba(120,170,90,0.16)" : "rgba(10,20,10,0.22)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Blade strokes: thousands of short near-vertical lines in varying green
  // shades — this is what actually reads as "grass" up close. Wider contrast
  // range (near-black to bright yellow-green) so blades are unmistakable
  // rather than blending into the base fill.
  const bladeColors = [
    "#0d1f0e",
    "#1e3f1c",
    "#2f5e2a",
    "#4a8a3e",
    "#6bab4a",
    "#8bc95c",
    "#173018",
  ];
  ctx.lineCap = "round";
  for (let i = 0; i < 9000; i++) {
    const x = rand(rng, 0, TILE_PX);
    const y = rand(rng, 0, TILE_PX);
    const len = rand(rng, 4, 13);
    const lean = rand(rng, -0.4, 0.4);
    const color = bladeColors[Math.floor(rng() * bladeColors.length)];

    ctx.strokeStyle = color;
    ctx.globalAlpha = rand(rng, 0.55, 1);
    ctx.lineWidth = rand(rng, 0.8, 2.1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * lean, y - len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sparse bright flecks — moonlight catching blade tips.
  for (let i = 0; i < 500; i++) {
    const x = rand(rng, 0, TILE_PX);
    const y = rand(rng, 0, TILE_PX);
    ctx.fillStyle = `rgba(210,240,170,${rand(rng, 0.3, 0.65)})`;
    ctx.fillRect(x, y, 1.2, rand(rng, 1.5, 3.5));
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Companion low-relief bump map (grayscale height variation matching the
 * blade pattern) so lighting picks up faint per-blade shading, not just flat
 * color — reinforces the "textured turf" read under raking moonlight.
 */
export function createGrassBumpMap(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_PX;
  canvas.height = TILE_PX;
  const ctx = canvas.getContext("2d")!;
  const rng = makeRng(4242);

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, TILE_PX, TILE_PX);

  ctx.lineCap = "round";
  for (let i = 0; i < 9000; i++) {
    const x = rand(rng, 0, TILE_PX);
    const y = rand(rng, 0, TILE_PX);
    const len = rand(rng, 4, 13);
    const lean = rand(rng, -0.4, 0.4);
    const shade = Math.floor(rand(rng, 40, 235));

    ctx.strokeStyle = `rgb(${shade},${shade},${shade})`;
    ctx.globalAlpha = rand(rng, 0.6, 1);
    ctx.lineWidth = rand(rng, 0.8, 2.1);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * lean, y - len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
