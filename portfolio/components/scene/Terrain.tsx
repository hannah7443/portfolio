"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fbm2D } from "./noise";
import { createGrassTexture, createGrassBumpMap } from "./grassTexture";

// World-space size of one grass-texture tile — smaller = finer-looking blades.
const GRASS_TILE_SIZE = 1.1;

// Terrain spans roughly [-HALF_SIZE, HALF_SIZE] on X and Z.
// Camera sits near +Z looking toward -Z, so "near" = larger z, "far" = smaller (more negative) z.
export const TERRAIN_SIZE = 70;
const HALF_SIZE = TERRAIN_SIZE / 2;
const SEGMENTS = 140;

const HILL_HEIGHT = 7;
const NOISE_AMP = 0.6;
const VALLEY_BASE_WIDTH = 4.5; // width of the valley floor at the far end (hills never fully pinch shut)
const VALLEY_OPENING_RATE = 0.08; // how much wider the valley gets per unit of +z (toward camera)
const HILL_RISE_DISTANCE = 11; // units of horizontal distance for a hill to climb to full height — larger = rounder, gentler slopes
const RIDGE_ROLL_AMP = 1.8; // low-frequency undulation added along hilltops so they read as rounded domes, not a flat mesa

// Perlin's smootherstep (6t^5-15t^4+10t^3): zero first AND second derivative at
// both ends, so the valley-edge-to-hilltop transition has no visible crease.
function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Height of the terrain surface at a given (x, z), matching the displacement
 * baked into the Terrain mesh's geometry. Exported so FlowerField and Scene
 * can seat objects (flowers, computers) correctly on the hill surface.
 */
export function heightAt(x: number, z: number): number {
  // Valley lane width grows as z increases (closer to camera) so the two hills
  // read as converging into the distance, matching the reference framing.
  const laneWidth = VALLEY_BASE_WIDTH + Math.max(0, z + HALF_SIZE) * VALLEY_OPENING_RATE;
  const distFromCenter = Math.abs(x) - laneWidth / 2;

  const t = THREE.MathUtils.clamp(distFromCenter / HILL_RISE_DISTANCE, 0, 1);
  const smooth = smootherstep(t);

  // Gentle large-scale roll along the ridge so hilltops read as a chain of soft
  // rounded domes rather than a flat plateau once they reach full height.
  const roll = (fbm2D(x * 0.02, z * 0.02, 2) - 0.5) * RIDGE_ROLL_AMP * smooth;
  const hill = smooth * HILL_HEIGHT + roll;

  const noise = (fbm2D(x * 0.045, z * 0.045, 4) - 0.5) * NOISE_AMP * (0.3 + smooth);

  return hill + noise;
}

/**
 * Grass ground color: a dark-green-dominant gradient by height (this is grass
 * at night, not a purple field — purple only shows up as a faint cool shadow
 * tint in the valley crevices, like moonlight shadow, not the base hue).
 * Layered with fine high-frequency noise as a per-vertex brightness/grain
 * multiplier so the surface reads as textured blades rather than flat paint,
 * plus coarser patchiness for clumps of lighter/darker grass.
 */
function colorAt(h: number, x: number, z: number): THREE.Color {
  const t = THREE.MathUtils.clamp(h / HILL_HEIGHT, 0, 1);
  const shadowGrass = new THREE.Color("#1c3820"); // dark grass in the valley shadow
  const midGrass = new THREE.Color("#3d7038"); // moonlit mid-slope grass
  const highGrass = new THREE.Color("#72a850"); // hilltop grass catching the most light

  const base =
    t < 0.5
      ? shadowGrass.clone().lerp(midGrass, t / 0.5)
      : midGrass.clone().lerp(highGrass, (t - 0.5) / 0.5);

  // Coarse patchiness: clumps of slightly darker/lighter grass. The blade-scale
  // grain itself comes from the tiled canvas texture (see grassTexture.ts) —
  // vertex colors only need to carry the broad height gradient + patch tint,
  // multiplying in another noise layer here would just wash out the texture's
  // contrast.
  const patch = fbm2D(x * 0.3, z * 0.3, 2) - 0.5;
  base.lerp(base.clone().multiplyScalar(patch > 0 ? 1.15 : 0.85), 0.5);

  // A whisper of cool purple-blue only in the deepest valley shadow, like faint
  // moonlight falloff — never the dominant hue.
  if (t < 0.18) {
    const shadowTint = new THREE.Color("#241a3a");
    base.lerp(shadowTint, (0.18 - t) / 0.18 * 0.25);
  }

  return base;
}

export default function Terrain() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = heightAt(x, z);
      pos.setY(i, y);

      const c = colorAt(y, x, z);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, []);

  const { map, bumpMap } = useMemo(() => {
    const repeat = TERRAIN_SIZE / GRASS_TILE_SIZE;
    const grassMap = createGrassTexture();
    grassMap.repeat.set(repeat, repeat);
    const grassBump = createGrassBumpMap();
    grassBump.repeat.set(repeat, repeat);
    return { map: grassMap, bumpMap: grassBump };
  }, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        vertexColors
        map={map}
        bumpMap={bumpMap}
        bumpScale={0.6}
        roughness={0.85}
        metalness={0}
      />
    </mesh>
  );
}
