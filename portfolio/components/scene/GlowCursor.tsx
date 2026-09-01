"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { END_LOOK } from "./IntroReveal";

const PARALLAX_STRENGTH = 0.9; // world units of max camera nudge
const LERP_SPEED = 3.5;

/**
 * Lives inside <Canvas>. After the intro settles, nudges the camera's look target
 * a small clamped amount toward wherever the pointer currently is.
 */
export function CursorParallax({ active }: { active: boolean }) {
  const { camera, pointer } = useThree();
  const basePos = useRef(new THREE.Vector3());
  const lookTarget = useRef(END_LOOK.clone());
  const captured = useRef(false);

  useFrame((_, delta) => {
    if (!active) return;

    if (!captured.current) {
      basePos.current.copy(camera.position);
      captured.current = true;
    }

    const targetX = basePos.current.x + pointer.x * PARALLAX_STRENGTH;
    const targetY = basePos.current.y + pointer.y * PARALLAX_STRENGTH * 0.5;

    const nextX = THREE.MathUtils.damp(camera.position.x, targetX, LERP_SPEED, delta);
    const nextY = THREE.MathUtils.damp(camera.position.y, targetY, LERP_SPEED, delta);
    camera.position.set(nextX, nextY, camera.position.z);
    camera.lookAt(lookTarget.current);
  });

  return null;
}

/**
 * Lives outside <Canvas>, as a plain DOM overlay. Hides the native cursor and
 * renders a small glowing orb that follows the raw screen pointer position.
 */
export function GlowCursorDot({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    const move = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX - 9}px, ${e.clientY - 9}px, 0)`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: 18,
        height: 18,
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: 100,
        background: "radial-gradient(circle, #f4ecff 0%, #b28cff 45%, rgba(178,140,255,0) 75%)",
        boxShadow: "0 0 16px 6px rgba(190,150,255,0.65)",
        willChange: "transform",
      }}
    />
  );
}
