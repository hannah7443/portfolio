"use client";

import { Html } from "@react-three/drei";
import type { ReactNode } from "react";

const DESIGN_W = 320;
const DESIGN_H = 240;

type ScreenOverlayProps = {
  children: ReactNode;
  /** world-unit width the design-size (320x240) content should fill; height follows the fixed aspect ratio. */
  worldWidth?: number;
};

export default function ScreenOverlay({ children, worldWidth = 60 }: ScreenOverlayProps) {
  // drei's Html `scale` (in transform mode) is how many world-units one CSS px maps to.
  const scale = worldWidth / DESIGN_W;

  return (
    <Html
      transform
      occlude="blending"
      scale={scale}
      position={[0, 0, 0.01]}
      style={{ pointerEvents: "auto" }}
    >
      <div
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          overflow: "hidden",
          borderRadius: 4,
        }}
      >
        {children}
      </div>
    </Html>
  );
}
