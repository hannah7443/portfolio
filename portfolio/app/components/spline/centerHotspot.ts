import type { TrackedRect } from "./useTrackedBoxes";

// Shared between ReturnHomeZone (which claims this spot) and any full-page
// hover cursor like ComingSoonCursor/ReadCaseStudyCursor (which need to
// yield it) so they never show their badges over the same pixels at once.
export const CENTER_HOTSPOT_RADIUS = 220;
// The hotspot reaches further above the flower's centroid than below/
// sideways — the boxes cluster low relative to where people actually hover
// "the middle", so a symmetric circle left the upper part of that area
// uncovered. Only the upward direction gets this bigger radius (see the
// ellipse check in isInCenterHotspot below).
export const CENTER_HOTSPOT_RADIUS_UP = 420;

/**
 * The flower's actual visual middle — the centroid of the four currently
 * visible nav boxes — rather than the container's literal geometric
 * center. The camera framing (GLOBAL_OFFSET_Y, VERTICAL_PAN, etc. in
 * useTrackedBoxes.ts/cameraFollow.ts) puts the flower well off dead-center
 * on screen, so a fixed container-center hotspot almost never lines up
 * with where a user is actually hovering "between the boxes". Returns null
 * if no nav boxes are currently visible/tracked (e.g. scene still loading).
 */
export function getFlowerCenter(rects: TrackedRect[]): { x: number; y: number } | null {
  const navRects = rects.filter((r) => r.marker.kind === "nav" && r.visible);
  if (navRects.length === 0) return null;
  const sum = navRects.reduce(
    (acc, r) => ({ x: acc.x + r.x + r.width / 2, y: acc.y + r.y + r.height / 2 }),
    { x: 0, y: 0 }
  );
  return { x: sum.x / navRects.length, y: sum.y / navRects.length };
}

/**
 * Whether (x, y) — container-relative pixels — falls in the flower's
 * designated center "return home" spot: an ellipse stretched upward (dy <
 * 0, since y grows downward) using CENTER_HOTSPOT_RADIUS_UP, and a regular
 * circle of CENTER_HOTSPOT_RADIUS everywhere else.
 */
export function isInCenterHotspot(x: number, y: number, center: { x: number; y: number }): boolean {
  const dx = x - center.x;
  const dy = y - center.y;
  const verticalRadius = dy < 0 ? CENTER_HOTSPOT_RADIUS_UP : CENTER_HOTSPOT_RADIUS;
  const normalizedX = dx / CENTER_HOTSPOT_RADIUS;
  const normalizedY = dy / verticalRadius;
  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
}
