"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";
import { attachCursorCameraFollow } from "./cameraFollow";

// `@splinetool/react-spline/next`'s Spline is an async function component
// (it awaits a preview-hash fetch before rendering) — legal only inside a
// Server Component. This file needs client-side interactivity (onLoad,
// refs, per-frame hooks), so it uses the base `@splinetool/react-spline`
// component instead, loaded client-only via next/dynamic (Spline's WebGL
// runtime can't run during SSR).
const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false });
import { useTrackedBoxes } from "./useTrackedBoxes";
import NavPreviewBox from "./NavPreviewBox";
import TextureEffectBox from "./TextureEffectBox";

const SCENE_URL = "https://prod.spline.design/pFFQjNMbfHZm6XIf/scene.splinecode";

export default function FlowerScene() {
  const appRef = useRef<Application | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cameraFollowCleanupRef = useRef<(() => void) | null>(null);
  const rects = useTrackedBoxes(appRef, containerRef);

  // Runs the cleanup captured in the ref (set from onLoad, once the scene
  // and its camera controls exist) when FlowerScene unmounts.
  useEffect(() => () => cameraFollowCleanupRef.current?.(), []);

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden">
      <Spline
        scene={SCENE_URL}
        onLoad={(app) => {
          appRef.current = app;
          if (containerRef.current) {
            cameraFollowCleanupRef.current = attachCursorCameraFollow(app, containerRef.current);
          }
        }}
      />

      {/* Overlay layer: pointer events pass through except on the boxes
          themselves. Camera orbit is now driven entirely by cursor position
          (see cameraFollow.ts) — native drag/zoom/pan is disabled, so there's
          nothing left for pointer-through to enable here besides clicking a
          tracker box itself. */}
      {/*
        Every box stays mounted permanently once rendered — only its
        position/opacity/visibility are updated per frame. A texture box's
        content (a WebGL canvas via shadergradient / @paper-design/shaders-react)
        is expensive to tear down and recreate; conditionally mounting it
        based on live per-frame visibility would spin up and destroy a WebGL
        context ~60x/sec, which exhausts the browser's WebGL context limit
        and can knock out Spline's own canvas too. CSS visibility is used to
        hide a box instead of unmounting it.
      */}
      <div className="pointer-events-none absolute inset-0 z-10">
        {rects.map((rect) => (
          <div
            key={rect.marker.name}
            className="pointer-events-none absolute border"
            style={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              opacity: rect.visible ? 1 - rect.depth * 0.4 : 0,
              visibility: rect.visible ? "visible" : "hidden",
              borderColor: "#b99d88",
              backgroundColor: rect.marker.kind === "nav" ? "rgba(128, 0, 0, 0.5)" : undefined,
            }}
          >
            {rect.marker.kind === "nav" ? (
              <NavPreviewBox marker={rect.marker} size={rect.width} />
            ) : (
              <TextureEffectBox marker={rect.marker} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
