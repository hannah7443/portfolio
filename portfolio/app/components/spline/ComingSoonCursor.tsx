"use client";

import { useEffect, useRef, useState } from "react";
import { useHoverFigTree } from "./HoverFigTreeContext";
import { getFlowerCenter, isInCenterHotspot } from "./centerHotspot";
import type { TrackedRect } from "./useTrackedBoxes";

// Offset from the raw cursor position so the badge doesn't sit directly
// under the pointer (matches the Figma prototype's dot being cursor-
// adjacent, not cursor-centered).
const OFFSET_X = 16;
const OFFSET_Y = 16;

/**
 * Cursor-follow "COMING SOON" badge for the radio hover overlay — a small
 * grey dot that expands into a pill revealing the text, per the Figma
 * motion prototype (Radio-Motion-Design, nodes 94:366/94:370/94:374; see
 * `coming-soon-reveal` in globals.css for the keyframe source/timing this
 * was translated from). Mounted once in FlowerScene.tsx; only tracks the
 * pointer and renders while the "radio" overlay is active — except inside
 * the center hotspot (see centerHotspot.ts), which yields to
 * ReturnHomeZone's "return home" badge there instead, so the two never
 * overlap.
 */
export function ComingSoonCursor({
  containerRef,
  rects,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  rects: TrackedRect[];
}) {
  const { active } = useHoverFigTree();
  const isActive = active === "radio";
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const rectsRef = useRef(rects);
  const [inHotspot, setInHotspot] = useState(false);
  const inHotspotRef = useRef(false);

  useEffect(() => {
    rectsRef.current = rects;
  }, [rects]);

  useEffect(() => {
    if (!isActive) return;

    const handlePointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      const center = getFlowerCenter(rectsRef.current);
      const next = center !== null && isInCenterHotspot(x, y, center);
      if (next !== inHotspotRef.current) {
        inHotspotRef.current = next;
        setInHotspot(next);
      }

      const el = badgeRef.current;
      if (!el) return;
      el.style.left = `${e.clientX + OFFSET_X}px`;
      el.style.top = `${e.clientY + OFFSET_Y}px`;
    };
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isActive, containerRef]);

  if (!isActive || inHotspot) return null;

  // Mounting fresh each time `isActive && !inHotspot` flips false→true
  // (this component returns null otherwise, so React unmounts/remounts the
  // div below rather than reusing one) is what replays the CSS animation
  // on every re-entry — no explicit "restart" key needed.
  return (
    <div
      ref={badgeRef}
      className="pointer-events-none fixed z-20 flex items-center justify-center overflow-hidden rounded-full bg-[#130754]"
      style={{
        height: 48,
        // `forwards` holds the expanded 233px/opacity-1 end state once the
        // animation completes, instead of snapping back to the 0%
        // keyframe.
        animation: "coming-soon-reveal 0.6s ease-out forwards",
      }}
    >
      <p
        className="whitespace-nowrap text-center font-bold uppercase text-white"
        style={{ fontFamily: '"Red Hat Mono", monospace', fontSize: 14, letterSpacing: "-0.01em" }}
      >
        Coming soon
      </p>
    </div>
  );
}
