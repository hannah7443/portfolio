"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Wide 3/4 establishing view (also the Canvas's initial camera position in Scene.tsx).
const START_POS = new THREE.Vector3(16, 14, 26);
const START_LOOK = new THREE.Vector3(0, 2, 5);

// Settled front-on view, close on the two computer screens.
const END_POS = new THREE.Vector3(0, 3.6, 16);
const END_LOOK = new THREE.Vector3(0, 1.6, 8);

const DURATION = 2.2; // seconds

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function IntroReveal({ onComplete }: { onComplete?: () => void }) {
  const { camera } = useThree();
  const startTime = useRef<number | null>(null);
  const done = useRef(false);
  const lookTarget = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.copy(START_POS);
    lookTarget.current.copy(START_LOOK);
    camera.lookAt(lookTarget.current);
  }, [camera]);

  useFrame(() => {
    if (done.current) return;

    // Measure elapsed against a wall-clock start captured on the first tick,
    // rather than accumulating per-frame deltas: accumulation is skewed both by
    // a possibly-inflated first delta (compile/hydration time before the render
    // loop starts) and by a slow/throttled frame rate stretching the animation
    // out well past DURATION in real time.
    const now = performance.now();
    if (startTime.current === null) startTime.current = now;

    const t = Math.min((now - startTime.current) / 1000 / DURATION, 1);
    const eased = easeInOutCubic(t);

    camera.position.lerpVectors(START_POS, END_POS, eased);
    lookTarget.current.lerpVectors(START_LOOK, END_LOOK, eased);
    camera.lookAt(lookTarget.current);

    if (t >= 1) {
      done.current = true;
      onComplete?.();
    }
  });

  return null;
}

export { END_LOOK };
