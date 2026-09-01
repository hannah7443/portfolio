"use client";

import { RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";

type RetroComputerProps = {
  position: [number, number, number];
  rotationY?: number;
  bodyColor?: string;
  bezelColor?: string;
  screenColor?: string;
  children?: ReactNode;
};

const BODY_W = 2.6;
const BODY_H = 2.2;
const BODY_D = 2.0;
const SCREEN_W = 1.7;
const SCREEN_H = 1.3;

export default function RetroComputer({
  position,
  rotationY = 0,
  bodyColor = "#e9e6f2",
  bezelColor = "#2a2438",
  screenColor = "#100a1c",
  children,
}: RetroComputerProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* base/foot */}
      <mesh position={[0, -BODY_H / 2 - 0.15, 0]}>
        <cylinderGeometry args={[0.55, 0.7, 0.3, 16]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>

      {/* main body */}
      <RoundedBox args={[BODY_W, BODY_H, BODY_D]} radius={0.22} smoothness={4} castShadow>
        <meshStandardMaterial color={bodyColor} roughness={0.5} metalness={0.05} />
      </RoundedBox>

      {/* bezel, recessed slightly into the front face */}
      <RoundedBox
        args={[SCREEN_W + 0.22, SCREEN_H + 0.22, 0.12]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.05, BODY_D / 2 + 0.02]}
      >
        <meshStandardMaterial color={bezelColor} roughness={0.7} />
      </RoundedBox>

      {/* screen surface: dark backing plane + Html overlay slot (children) sits just in front */}
      <mesh position={[0, 0.05, BODY_D / 2 + 0.09]}>
        <planeGeometry args={[SCREEN_W, SCREEN_H]} />
        <meshBasicMaterial color={screenColor} toneMapped={false} />
      </mesh>

      <group position={[0, 0.05, BODY_D / 2 + 0.1]}>{children}</group>
    </group>
  );
}
