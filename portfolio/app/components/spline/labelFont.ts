// Shared between NavPreviewBox (renders the label) and useTrackedBoxes
// (measures it to widen a box that's too narrow to fit the label on one
// line) — kept in one place so they can't drift out of sync.
export const LABEL_FONT_SIZE_PX = 11;
export const LABEL_FONT = `bold ${LABEL_FONT_SIZE_PX}px "Red Hat Mono", monospace`;
export const LABEL_PADDING_PX = 8; // horizontal padding on each side
// Shared between the box outline (FlowerScene.tsx) and the nav label text
// (NavPreviewBox.tsx) so they always match.
export const MARKER_ACCENT_COLOR = "#5B1717";

let measureCanvas: HTMLCanvasElement | undefined;

/** Width in pixels the label would render at, in LABEL_FONT. Browser-only. */
export function measureLabelWidth(text: string): number {
  if (!measureCanvas) measureCanvas = document.createElement("canvas");
  const ctx = measureCanvas.getContext("2d");
  if (!ctx) return 0;
  ctx.font = LABEL_FONT;
  return ctx.measureText(text).width;
}
