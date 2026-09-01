"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heightAt, TERRAIN_SIZE } from "./Terrain";
import { fbm2D } from "./noise";
import {
  createFlowerStemGeometry,
  createFlowerPetalsGeometry,
  createFlowerCoreGeometry,
} from "./flowerGeometry";

const HALF = TERRAIN_SIZE / 2;
const COUNT = 4200; // higher than before since flowers now also cover the valley floor
const EXCLUSION_RADIUS = 1.6; // keep flowers off the computers' immediate footprint
const COMPUTER_CENTERS: [number, number][] = [
  [-1.1, 8],
  [1.1, 8],
];
const MAX_TILT = 0.4; // radians (~23°) of random lean off vertical, per flower

type Flower = {
  position: [number, number, number];
  scale: number;
  // Stem, petals, and core are separate InstancedMesh layers (different
  // materials) but share this exact rotation so they recombine into one
  // rigid, consistently-angled flower per instance.
  rotation: [number, number, number];
};

function isExcluded(x: number, z: number) {
  return COMPUTER_CENTERS.some(([cx, cz]) => {
    const dx = x - cx;
    const dz = z - cz;
    return dx * dx + dz * dz < EXCLUSION_RADIUS * EXCLUSION_RADIUS;
  });
}

/** Populates an InstancedMesh's transforms once from a Flower array — used
 * for all three layers below instead of drei's <Instance> JSX-per-item
 * pattern, which carries real React overhead at thousands of instances
 * (mounting 3 x 4200 of them was stalling the page for seconds). */
function useFlowerLayer(ref: React.RefObject<THREE.InstancedMesh | null>, flowers: Flower[]) {
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const dummy = new THREE.Object3D();
    flowers.forEach((f, i) => {
      dummy.position.set(...f.position);
      dummy.rotation.set(...f.rotation);
      dummy.scale.setScalar(f.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, flowers]);
}

export default function FlowerField() {
  const flowers = useMemo<Flower[]>(() => {
    const list: Flower[] = [];
    let seed = 0;
    let attempts = 0;

    while (list.length < COUNT && attempts < COUNT * 4) {
      attempts++;
      seed += 1;
      const rx = fbm2D(seed * 0.31, 1.7, 1);
      const rz = fbm2D(1.7, seed * 0.29, 1);
      const x = (rx * 2 - 1) * HALF * 0.92;
      const z = (rz * 2 - 1) * HALF * 0.92;

      // flowers now cover the valley floor too — only keep a clearing
      // immediately around the computers so the screens stay reachable.
      if (isExcluded(x, z)) continue;

      const y = heightAt(x, z);
      const scaleNoise = fbm2D(x * 0.2, z * 0.2, 2);
      const yaw = fbm2D(x * 0.7, z * 0.7, 1) * Math.PI * 2;
      const tiltX = (fbm2D(x * 1.3, z * 1.3, 1) - 0.5) * 2 * MAX_TILT;
      const tiltZ = (fbm2D(x * 1.3 + 50, z * 1.3 + 50, 1) - 0.5) * 2 * MAX_TILT;

      list.push({
        position: [x, y, z],
        scale: 0.5 + scaleNoise * 0.9,
        rotation: [tiltX, yaw, tiltZ],
      });
    }

    return list;
  }, []);

  const stemGeo = useMemo(() => createFlowerStemGeometry(), []);
  const petalsGeo = useMemo(() => createFlowerPetalsGeometry(6), []);
  const coreGeo = useMemo(() => createFlowerCoreGeometry(), []);

  const stemRef = useRef<THREE.InstancedMesh>(null);
  const petalsRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.InstancedMesh>(null);

  useFlowerLayer(stemRef, flowers);
  useFlowerLayer(petalsRef, flowers);
  useFlowerLayer(coreRef, flowers);

  return (
    <group>
      {/* Stem: thin, matte green, non-emissive. */}
      <instancedMesh ref={stemRef} args={[stemGeo, undefined, flowers.length]}>
        <meshStandardMaterial color="#2f5a2a" roughness={0.9} />
      </instancedMesh>

      {/* Petal cup: glowing purple lobes, matching the reference flower model. */}
      <instancedMesh ref={petalsRef} args={[petalsGeo, undefined, flowers.length]}>
        <meshStandardMaterial
          color="#a56bd6"
          emissive="#7a3fb0"
          emissiveIntensity={0.9}
          roughness={0.4}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Bright glowing core, nested inside the petal cup. */}
      <instancedMesh ref={coreRef} args={[coreGeo, undefined, flowers.length]}>
        <meshStandardMaterial
          color="#d8ffb0"
          emissive="#aef26a"
          emissiveIntensity={3}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}
