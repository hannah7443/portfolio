"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt, TERRAIN_SIZE } from "./Terrain";
import { fbm2D } from "./noise";
import { createGrassBladeGeometry } from "./grassBladeGeometry";

const HALF = TERRAIN_SIZE / 2;
const COUNT = 45000; // dense coverage across hills AND valley floor, without a multi-second setup stall
const EXCLUSION_RADIUS = 3.2; // keep blades off the computers' immediate footprint
const COMPUTER_CENTERS: [number, number][] = [
  [-1.1, 8],
  [1.1, 8],
];

type Blade = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
};

function isExcluded(x: number, z: number) {
  return COMPUTER_CENTERS.some(([cx, cz]) => {
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < EXCLUSION_RADIUS * EXCLUSION_RADIUS;
  });
}

/**
 * Real 3D blades scattered across the hillsides, on top of the terrain's own
 * tiled grass texture — a flat diffuse texture alone reads as a pattern, not
 * individual strands; these give the close-range wispy-meadow silhouette a
 * texture can't produce on its own.
 *
 * At this instance count (six figures), drei's <Instances>/<Instance> JSX
 * pattern is the wrong tool: each <Instance> is a real React/fiber component
 * with its own hooks, so mounting 100k+ of them stalls the whole page for
 * seconds (blocking the intro/cursor, not just this component) even though
 * the GPU only ever sees one draw call either way. A raw THREE.InstancedMesh,
 * populated once via an imperative loop, gets the same single-draw-call
 * result with none of that React overhead.
 */
export default function GrassBlades() {
  const blades = useMemo<Blade[]>(() => {
    const list: Blade[] = [];
    let seed = 1000; // offset from FlowerField's seed sequence so patterns don't line up
    let attempts = 0;

    while (list.length < COUNT && attempts < COUNT * 5) {
      attempts++;
      seed += 1;
      const rx = fbm2D(seed * 0.17, 3.1, 1);
      const rz = fbm2D(3.1, seed * 0.19, 1);
      const x = (rx * 2 - 1) * HALF * 0.94;
      const z = (rz * 2 - 1) * HALF * 0.94;

      // blades now cover the valley floor too — only keep a clearing
      // immediately around the computers so the screens stay reachable.
      if (isExcluded(x, z)) continue;

      const y = heightAt(x, z);
      const yaw = fbm2D(x * 1.1, z * 1.1, 1) * Math.PI * 2;

      // Broad, low-frequency field so neighboring blades share a tendency
      // toward tall/short — this is what produces visible tall CLUSTERS
      // rather than uniformly-scattered individual height jitter.
      const patchTall = fbm2D(x * 0.06, z * 0.06, 3);
      // Finer per-blade jitter layered on top of the patch bias.
      const fineJitter = fbm2D(x * 1.7 + 91, z * 1.7 + 91, 2);
      // Occasional standout blade, taller than even its own tall patch.
      const spike = fbm2D(x * 3.9 + 400, z * 3.9 + 400, 1);
      const spikeBoost = spike > 0.93 ? (spike - 0.93) / 0.07 : 0;

      const heightScale = 0.35 + patchTall * 1.55 + fineJitter * 0.35 + spikeBoost * 1.3;

      // Width varies mostly independently of height — thin tall blades and
      // short stubby clumps both read as natural. Slightly wider baseline
      // than before to keep coverage dense at a lower instance count.
      const widthNoise = fbm2D(x * 2.3 + 777, z * 2.3 + 777, 2);
      const widthScale = 0.75 + widthNoise * 1.5;

      // Lean: much wider spread, and an independent axis each, so blades
      // splay in many directions rather than all echoing the same tilt.
      const tiltX = (fbm2D(x * 2.9 + 12, z * 2.9 + 12, 1) - 0.5) * 1.1;
      const tiltZ = (fbm2D(x * 2.9 + 512, z * 2.9 + 512, 1) - 0.5) * 1.1;

      list.push({
        position: [x, y, z],
        rotation: [tiltX, yaw, tiltZ],
        scale: [widthScale, heightScale, widthScale],
      });
    }

    return list;
  }, []);

  const bladeGeo = useMemo(() => createGrassBladeGeometry(), []);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    blades.forEach((b, i) => {
      dummy.position.set(...b.position);
      dummy.rotation.set(...b.rotation);
      dummy.scale.set(...b.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [blades]);

  return (
    <instancedMesh ref={meshRef} args={[bladeGeo, undefined, blades.length]}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.85} />
    </instancedMesh>
  );
}
