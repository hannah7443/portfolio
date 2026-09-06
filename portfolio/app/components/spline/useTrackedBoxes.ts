"use client";

import { useEffect, useRef, useState } from "react";
import type { Application, SPEObject } from "@splinetool/runtime";
import { projectObject } from "./projection";
import { MARKERS, type Marker } from "./markers";
import { measureLabelWidth, LABEL_PADDING_PX } from "./labelFont";

// Fixed on-screen box size in pixels, centered on the marker's true
// world-space position. The markers are near-point-scale in Spline (their
// own scale.x/y footprint projects to ~1px), so deriving size from that
// footprint required a huge, fragile multiplier — any tiny skew in the
// footprint's projected direction (from parent rotation/scale) got
// amplified into a visibly wrong box. A fixed size decoupled from that
// footprint avoids the issue entirely; tune this number directly.
const BOX_SIZE = 90;
// Boxes shrink slightly as their marker rotates toward the far side of the
// flower, purely for a bit of depth realism — 1 at the near clip, down to
// this fraction at the far clip.
const MIN_DEPTH_SCALE = 0.7;
// Applied to every marker on top of its own offsetX/offsetY — for a
// uniform nudge across all boxes at once, without touching each one.
const GLOBAL_OFFSET_X = 0;
const GLOBAL_OFFSET_Y = 160;
// BOX_SIZE, GLOBAL_OFFSET_X/Y, and every marker's offsetX/offsetY above are
// all tuned as pixel values against a viewport around this height (a normal
// windowed browser). They're scaled by (actual height / this) below, so
// going fullscreen — or any other viewport height — doesn't leave them
// proportionally too small/large relative to the now-differently-sized
// rendered flower. If the base sizing/offsets ever need recalibrating,
// change this to whatever height you're actively tuning against.
const REFERENCE_HEIGHT = 800;

export type TrackedRect = {
  marker: Marker;
  /** Screen-space box in pixels, relative to the Spline canvas's top-left. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Roughly how far away the object is (0..1, smaller = closer to camera). Used to fade/scale boxes that rotate to the far side. */
  depth: number;
  visible: boolean;
};

/**
 * Every frame, looks up each configured marker object in the loaded Spline
 * scene and projects its world position + a fixed screen-space size to
 * pixel coordinates, so overlay boxes stay visually locked to the 3D
 * object as the camera orbits. Falls back to `visible: false` for any
 * marker not found (e.g. a name typo, or before the scene finishes loading).
 */
export function useTrackedBoxes(
  appRef: React.RefObject<Application | null>,
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [rects, setRects] = useState<TrackedRect[]>([]);
  const objectsRef = useRef<Record<string, SPEObject | undefined>>({});
  const prevRef = useRef<TrackedRect[]>([]);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    function resolveObjects() {
      const app = appRef.current;
      if (!app) return;
      for (const marker of MARKERS) {
        if (!objectsRef.current[marker.name]) {
          objectsRef.current[marker.name] = app.findObjectByName(marker.name);
        }
      }
    }

    function tick() {
      if (cancelled) return;
      const app = appRef.current;
      const container = containerRef.current;
      if (!app || !container) {
        raf = requestAnimationFrame(tick);
        return;
      }
      resolveObjects();
      const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

      const next: TrackedRect[] = MARKERS.map((marker) => {
        const object = objectsRef.current[marker.name];
        if (!object) {
          return { marker, x: 0, y: 0, width: 0, height: 0, depth: 1, visible: false };
        }
        const projected = projectObject(app, object, containerWidth, containerHeight);
        if (!projected) {
          return { marker, x: 0, y: 0, width: 0, height: 0, depth: 1, visible: false };
        }
        const viewportScale = containerHeight / REFERENCE_HEIGHT;
        const depth = (projected.z + 1) / 2;
        const depthScale = 1 - depth * (1 - MIN_DEPTH_SCALE);
        const baseSize = BOX_SIZE * viewportScale * depthScale * (marker.sizeScale ?? 1);
        const height = baseSize * (marker.heightScale ?? 1);
        // A nav box widens past its normal size if it's too narrow to fit
        // its label on one line — unless the marker opts into wrapping the
        // label across multiple lines instead, in which case the box just
        // stays its normal size. Position math below stays centered on the
        // same point either way.
        const minWidthForLabel =
          marker.kind === "nav" && !marker.wrapLabel ? measureLabelWidth(marker.label) + LABEL_PADDING_PX * 2 : 0;
        const width = Math.max(baseSize, minWidthForLabel);
        return {
          marker,
          x: projected.x - width / 2 + ((marker.offsetX ?? 0) + GLOBAL_OFFSET_X) * viewportScale,
          y: projected.y - height / 2 + ((marker.offsetY ?? 0) + GLOBAL_OFFSET_Y) * viewportScale,
          width,
          height,
          depth,
          visible: projected.z < 1,
        };
      });

      // Skip the state update (and the re-render it triggers) when nothing
      // moved meaningfully — the camera is often static between user drags,
      // and re-rendering 60x/sec for no visual change is wasted work.
      const prev = prevRef.current;
      const changed =
        prev.length !== next.length ||
        next.some((r, i) => {
          const p = prev[i];
          return (
            !p ||
            p.visible !== r.visible ||
            Math.abs(p.x - r.x) > 0.5 ||
            Math.abs(p.y - r.y) > 0.5 ||
            Math.abs(p.width - r.width) > 0.5
          );
        });
      if (changed) {
        prevRef.current = next;
        setRects(next);
      }
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [appRef, containerRef]);

  return rects;
}
