"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHoverFigTree } from "./HoverFigTreeContext";
import { getFlowerCenter, isInCenterHotspot } from "./centerHotspot";
import type { TrackedRect } from "./useTrackedBoxes";

const OFFSET_X = 16;
const OFFSET_Y = 16;

/**
 * "Return home" affordance for the flower's hover pages (fig-tree/radio/
 * playground/about — i.e. whenever one of the four overlays is active),
 * shown only in the designated center hotspot (see centerHotspot.ts) — the
 * middle of the flower, between the four nav boxes — rather than the whole
 * background. It used to claim that entire background (everything not
 * over a nav box), but that overlapped each page's own full-background
 * cursor (ComingSoonCursor on radio, ReadCaseStudyCursor on fig-tree);
 * shrinking this to just the center spot, with those two yielding that
 * same spot (see their own comments), keeps them from ever showing at
 * once. Deliberately excluded when no overlay is active (the true resting
 * home state — no "return home" needed there) and on any other route
 * entirely, since only the homepage renders the flower/box geometry this
 * reuses. Shows a cursor-follow badge (same dot→pill reveal as
 * ComingSoonCursor — see `coming-soon-reveal` in globals.css) and, while
 * shown, makes the hotspot clickable to go back to `/`.
 */
export function ReturnHomeZone({
  rects,
  containerRef,
}: {
  rects: TrackedRect[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { active, deactivate } = useHoverFigTree();
  const router = useRouter();
  const labelRef = useRef<HTMLDivElement | null>(null);
  const rectsRef = useRef(rects);
  const activeRef = useRef(active);
  const [inHotspot, setInHotspot] = useState(false);
  const inHotspotRef = useRef(false);

  useEffect(() => {
    rectsRef.current = rects;
  }, [rects]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
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
      const inZone = center !== null && isInCenterHotspot(x, y, center) && !overNavBox && activeRef.current !== null;

      if (inZone !== inHotspotRef.current) {
        inHotspotRef.current = inZone;
        setInHotspot(inZone);
      }
      if (inZone && labelRef.current) {
        labelRef.current.style.left = `${e.clientX + OFFSET_X}px`;
        labelRef.current.style.top = `${e.clientY + OFFSET_Y}px`;
      }
    }
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [containerRef]);

  return (
    <>
      {/* Mounting fresh each time `inHotspot` flips false→true is what
          replays the CSS animation on every re-entry — same reasoning as
          ComingSoonCursor. */}
      {inHotspot && (
        <div
          ref={labelRef}
          className="pointer-events-none fixed z-20 flex items-center justify-center overflow-hidden rounded-full bg-[#2a1717]"
          style={{
            height: 54,
            // `forwards` holds the expanded end state once the animation
            // completes, instead of snapping back to the 0% keyframe.
            animation: "coming-soon-reveal 0.6s ease-out forwards",
          }}
        >
          <p
            className="whitespace-nowrap text-center font-bold uppercase text-white"
            style={{ fontFamily: '"Red Hat Mono", monospace', fontSize: 14, letterSpacing: "-0.01em" }}
          >
            Return home
          </p>
        </div>
      )}
      {/* Above the four overlay click-catchers (z-5) — this only turns on
          (pointer-events auto) while the live cursor position is actually
          inside the hotspot, so it intercepts a click there instead of the
          active overlay's own catcher treating it as a "close overlay"
          click; everywhere else it's pointer-events: none and the z-5
          catcher behaves as usual. Still below the nav boxes (z-10). */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 6, pointerEvents: inHotspot ? "auto" : "none", cursor: inHotspot ? "pointer" : undefined }}
        onClick={() => {
          if (!inHotspot) return;
          // Same pairing as the other click-catchers (HoverFigTree/
          // HoverAbout) — without deactivate(), the overlay context state
          // would stay "active" after landing back on "/" (a same-route
          // client-side navigation doesn't remount it), leaving a stale
          // overlay showing instead of the true resting home state.
          deactivate();
          router.push("/");
        }}
      />
    </>
  );
}
