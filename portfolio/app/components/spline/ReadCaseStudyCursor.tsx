"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHoverFigTree } from "./HoverFigTreeContext";
import { getFlowerCenter, isInCenterHotspot } from "./centerHotspot";
import type { TrackedRect } from "./useTrackedBoxes";

const OFFSET_X = 16;
const OFFSET_Y = 16;

/**
 * "Read full case study" cursor for the fig-tree hover page — shown
 * anywhere on screen while that overlay is active, except the small nav-box
 * regions themselves (those keep their own Link/box-switch hover behavior)
 * and the center hotspot (see centerHotspot.ts), which yields to
 * ReturnHomeZone's "return home" badge there instead, so the two never
 * overlap — same pattern as ComingSoonCursor on the radio page. Same
 * dot→pill reveal style as ComingSoonCursor, just a wider final width for
 * this longer label (see `case-study-reveal` in globals.css). Clicking
 * navigates to `href` (default /work/fig-tree), matching HoverFigTreeClickCatcher's own
 * full-screen click behavior (this is a visual cursor cue for that same
 * click target, not a new one).
 */
export function ReadCaseStudyCursor({
  rects,
  containerRef,
  overlayId = "fig-tree",
  href = "/work/fig-tree",
  label = "Read full case study",
  badgeClassName = "bg-[#2d2f20]",
}: {
  rects: TrackedRect[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  overlayId?: "fig-tree" | "radio";
  href?: string;
  label?: string;
  badgeClassName?: string;
}) {
  const { active, deactivate } = useHoverFigTree();
  const router = useRouter();
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const rectsRef = useRef(rects);
  const [inZone, setInZone] = useState(false);
  const inZoneRef = useRef(false);

  useEffect(() => {
    rectsRef.current = rects;
  }, [rects]);

  const isActive = active === overlayId;

  useEffect(() => {
    // No need to reset `inZone` when `isActive` goes false — `showing`
    // below already gates on `isActive`, so a stale `inZone` is harmless
    // and just gets recomputed once pointer tracking resumes.
    if (!isActive) return;

    function handlePointerMove(e: PointerEvent) {
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;

      const overNavBox = rectsRef.current.some(
        (r) => r.marker.kind === "nav" && r.visible && x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
      );
      const center = getFlowerCenter(rectsRef.current);
      const inHotspot = center !== null && isInCenterHotspot(x, y, center);
      const next = !overNavBox && !inHotspot;

      if (next !== inZoneRef.current) {
        inZoneRef.current = next;
        setInZone(next);
      }
      if (next && badgeRef.current) {
        badgeRef.current.style.left = `${e.clientX + OFFSET_X}px`;
        badgeRef.current.style.top = `${e.clientY + OFFSET_Y}px`;
      }
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isActive, containerRef]);

  const showing = isActive && inZone;

  return (
    <>
      {/* Mounting fresh each time `showing` flips false→true replays the
          CSS animation on every re-entry — same reasoning as
          ComingSoonCursor. */}
      {showing && (
        <div
          ref={badgeRef}
          className={`pointer-events-none fixed z-20 flex items-center justify-center overflow-hidden rounded-full ${badgeClassName}`}
          style={{
            height: 54,
            animation: "case-study-reveal 0.6s ease-out forwards",
          }}
        >
          <p
            className="whitespace-nowrap text-center font-bold uppercase text-white"
            style={{ fontFamily: '"Red Hat Mono", monospace', fontSize: 14, letterSpacing: "-0.01em" }}
          >
            {label}
          </p>
        </div>
      )}
      {/* Same z-index reasoning as ReturnHomeZone: above the overlay's own
          full-screen click-catcher (z-5) so it can be the thing that
          actually fires on click, only turned on where the cursor
          currently is. */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 6, pointerEvents: showing ? "auto" : "none", cursor: showing ? "pointer" : undefined }}
        onClick={() => {
          if (!showing) return;
          deactivate();
          router.push(href);
        }}
      />
    </>
  );
}
