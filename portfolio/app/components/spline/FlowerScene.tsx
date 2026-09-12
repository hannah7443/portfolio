"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Application } from "@splinetool/runtime";
import { attachCursorCameraFollow } from "./cameraFollow";
import { MARKER_ACCENT_COLOR } from "./labelFont";

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
import { HoverFigTreeVisual, HoverFigTreeClickCatcher } from "./HoverFigTree";
import { HoverAboutVisual, HoverAboutClickCatcher } from "./HoverAbout";
import { HoverRadioVisual, HoverRadioClickCatcher } from "./HoverRadio";
import { HoverPlaygroundVisual, HoverPlaygroundLinks, HoverPlaygroundClickCatcher } from "./HoverPlayground";
import { PlaygroundVideoOverlay } from "./PlaygroundVideoOverlay";
import { HomeBackground } from "./HomeBackground";

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
      {/* Behind the flower: no z-index, mounted before <Spline> in the DOM
          so normal paint order puts Spline's canvas on top of it.
          HomeBackground goes first (furthest back) since it's always
          visible — HoverFigTreeVisual/HoverRadioVisual paint over it with
          their own opaque bg-black whenever a hover overlay is active. */}
      <HomeBackground />
      <HoverFigTreeVisual />
      <HoverAboutVisual />
      <HoverRadioVisual />
      <HoverPlaygroundVisual />

      <Spline
        scene={SCENE_URL}
        // Explicit position+z-index: Spline's own wrapper div is
        // unpositioned (position: static), so without this it would
        // paint *behind* HoverFigTreeVisual regardless of DOM order —
        // CSS stacks any positioned sibling (even z-index: auto) above
        // in-flow static content no matter which comes first in markup.
        style={{ position: "relative", zIndex: 1 }}
        onLoad={(app) => {
          appRef.current = app;
          // Scene otherwise renders its own opaque background (it just
          // happens to match the page's bg-black, so this went unnoticed
          // until hover-fig-tree needed to show through from behind) —
          // make it transparent so only the flower geometry itself is
          // opaque and the overlay behind it can show through everywhere
          // else.
          app.setBackgroundColor("transparent");
          if (containerRef.current) {
            cameraFollowCleanupRef.current = attachCursorCameraFollow(app, containerRef.current);
          }
        }}
      />

      {/* Above the flower canvas but below the nav-marker boxes (z-10) —
          catches a click anywhere else on the page while the overlay is up
          and routes to the fig-tree case study. */}
      <HoverFigTreeClickCatcher />
      <HoverAboutClickCatcher />
      <HoverRadioClickCatcher />
      <HoverPlaygroundClickCatcher />

      {/* Above the click-catchers (z-5) but below the nav-marker boxes
          (z-10) — the actual clickable @handle links in HoverPlayground's
          "WELCOME TO MY MOSAIC OF CREATIVITY" box (see HoverPlayground.tsx
          for why these can't just live inside HoverPlaygroundVisual). */}
      <HoverPlaygroundLinks />

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
              opacity: rect.visible ? 1 : 0,
              visibility: rect.visible ? "visible" : "hidden",
              borderColor: MARKER_ACCENT_COLOR,
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

      {/* Above absolutely everything (including the nav-marker boxes) —
          the modal opened by clicking a HoverPlayground video tile. */}
      <PlaygroundVideoOverlay />
    </div>
  );
}
