"use client";

import { useEffect, useRef, useState } from "react";
import { useHoverFigTree } from "./HoverFigTreeContext";

// Figma "playground" (node 526:45), reproduced as one fixed-aspect collage
// canvas (unlike HoverFigTree/HoverRadio's fluid two-column layouts — this
// design is a literal photo/video wall, so its own 1314x868 frame is kept
// as a single percentage-positioned box instead of re-derived into a flex
// layout) sitting behind the 3D flower, same as the other hover overlays.
// Every named layer in the design corresponds 1:1 to a clip in
// public/artwork, playing on loop, muted by default.
const FRAME = { w: 1314, h: 868 };

type Box = { x: number; y: number; w: number; h: number };
const pct = (v: number, total: number) => `${(v / total) * 100}%`;
const boxStyle = (box: Box) => ({
  left: pct(box.x, FRAME.w),
  top: pct(box.y, FRAME.h),
  width: pct(box.w, FRAME.w),
  height: pct(box.h, FRAME.h),
});

export type VideoTile = { name: string; src: string; box: Box };

// Positions/sizes lifted straight from get_design_context on node 526:45.
// Corner radius is intentionally NOT taken from the design (which varies
// per layer, 0-43px) — every tile gets the same small rounding instead,
// per the brief ("just slightly round the corners of each").
// The left-side items' shared left edge, chosen to line up with the "P" in
// "PLAYGROUND": the title has `marginLeft: -2vw` relative to the same
// EDGE_MARGIN-padded content box this collage frame sits in, and the
// collage frame's own 1314 units map to (100 - 2*4)vw = 92vw of that box —
// so -2vw of real width equals -2/92*1314 ≈ -28.6 frame units.
const LEFT_EDGE_X = -28.6;
// Frame width (1314) plus that same 28.6 offset, mirrored — every
// right-side item's `x + w` is set to land exactly here.
const RIGHT_EDGE_X = FRAME.w + 28.6;

export const VIDEO_TILES: VideoTile[] = [
  // w/h scaled up 8% (top-left anchor kept, so it grows toward the empty
  // space below/right of it — checked clear of weird-fishes/mosaic-box).
  { name: "mary-oliver", src: "/artwork/Mary-Oliver.MOV", box: { x: 426, y: 80, w: 359.64, h: 268.92 } },
  // w/h scaled up 6% (x recomputed off RIGHT_EDGE_X so the right margin
  // stays put; y unchanged). Checked clear of every neighbor at the new
  // size: bottom (244+212=456) still clears mosaic-box above it (which
  // ends at 80+143=223) and stays short of shadow-puppets (y475) and
  // memories (y469); right edge is unchanged, so mary-oliver is unaffected.
  { name: "weird-fishes", src: "/artwork/Weird-Fishes.mov", box: { x: RIGHT_EDGE_X - 376.3, y: 244, w: 376.3, h: 212 } },
  // y shifted down (+35) so it clears weird-fishes's bottom edge
  // (244+200=444) with margin, instead of the ~4-unit overlap it had before.
  // x shifted right (+80) — kept short of memories's left edge
  // (RIGHT_EDGE_X - 212 ≈ 1130.6) so it doesn't overlap it.
  { name: "shadow-puppets", src: "/artwork/Shadow-Puppets.MP4", box: { x: 768, y: 475, w: 327, h: 183 } },
  // w/h scaled up 8%, x kept at LEFT_EDGE_X so its left margin is
  // unchanged. y shifted down (+40, matching EXPLORING_BOX's own +40 move
  // below) — new bottom (178+220.32=398.32) still clears the "Currently
  // Exploring..." box's new top (413), and new right (-28.6+392.04=363.4)
  // still clears mary-oliver's left edge (426).
  { name: "september-rain", src: "/artwork/September-Rain.MP4", box: { x: LEFT_EDGE_X, y: 178, w: 392.04, h: 220.32 } },
  // y shifted down (+35), same reasoning as shadow-puppets — it also
  // overlapped weird-fishes horizontally (both sit against RIGHT_EDGE_X).
  { name: "memories", src: "/artwork/Memories.mp4", box: { x: RIGHT_EDGE_X - 212, y: 469, w: 212, h: 379 } },
  { name: "rilkean-heart", src: "/artwork/Rilkean-Heart.mov", box: { x: LEFT_EDGE_X, y: 571, w: 268, h: 205 } },
  { name: "cowboys-angels", src: "/artwork/Cowboys-Angels.mov", box: { x: 311, y: 579, w: 266, h: 201 } },
  // y shifted down (+35) to move with shadow-puppets/memories; x set so
  // its right edge (x+w) matches shadow-puppets's own right edge
  // (768+327=1095).
  { name: "coffee-cup", src: "/artwork/Coffee-Cup.MOV", box: { x: 1095 - 218, y: 671, w: 218, h: 187 } },
];

// w extended so its right edge (x+w) matches cowboys-angels's own right
// edge (311+266=577). y shifted down (+40) and h shortened (-50) — moves
// the box down while making it shorter overall (top drops 40, bottom rises
// from 555 to 545 — still clear of rilkean-heart's top at 571).
const EXPLORING_BOX: Box = { x: LEFT_EDGE_X, y: 413, w: 577 - LEFT_EDGE_X, h: 132 };
// x pulled back in from 768 so its left edge (800) clears mary-oliver's
// right edge (426+359.64=785.64) instead of overlapping it, keeping the
// right edge at RIGHT_EDGE_X (so w shrinks along with it).
const MOSAIC_BOX: Box = { x: 800, y: 80, w: RIGHT_EDGE_X - 800, h: 143 };

// Same white-outline text-box treatment as the "Deliverables"/"Stakeholders"
// boxes on the fig-tree/radio hover pages: border border-white, bold
// font-mono heading, regular font-mono uppercase body.
//
// `invisible` renders the exact same box/text layout fully transparent
// (border included) instead of white-on-nothing — used by
// HoverPlaygroundLinks to lay real, clickable <a> tags exactly on top of
// the visible copy in HoverPlaygroundVisual, since that visible copy lives
// behind the Spline canvas (so the flower still occludes it) and can't
// itself receive clicks.
function TextBox({
  box,
  align,
  invisible,
  children,
}: {
  box: Box;
  align: "left" | "right";
  invisible?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute p-[1.4%] font-mono uppercase ${align === "right" ? "text-right" : ""} ${
        invisible ? "border border-transparent text-transparent" : "border border-white text-white"
      }`}
      style={{ ...boxStyle(box), fontSize: "1.1vw", lineHeight: 1.5 }}
    >
      {children}
    </div>
  );
}

// The @handles line in the "WELCOME TO MY MOSAIC OF CREATIVITY" box.
// `interactive` swaps each platform name for a real link (used only by
// HoverPlaygroundLinks — see TextBox's `invisible` doc above for why the
// visible copy can't just be a link itself).
const SOCIAL_LINKS = [
  { label: "X", href: "https://x.com/hannahsmosaic" },
  { label: "INSTAGRAM", href: "https://www.instagram.com/hannahs.mosaic/" },
  { label: "TIKTOK", href: "https://www.tiktok.com/@hannahs.mosaic" },
];

function MosaicHandles({ interactive }: { interactive: boolean }) {
  return (
    <p className="mt-[1em]">
      @HANNAHS.MOSAIC
      <br />
      {SOCIAL_LINKS.map(({ label, href }, i) => (
        <span key={label}>
          {interactive ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto underline">
              {label}
            </a>
          ) : (
            <span className="underline">{label}</span>
          )}
          {i < SOCIAL_LINKS.length - 1 ? ", " : ""}
        </span>
      ))}
    </p>
  );
}

/**
 * The visual design itself — sits behind the 3D flower (mount it before
 * <Spline> in the DOM, no z-index, so normal paint order puts Spline's
 * canvas on top of it). Purely decorative: pointer-events are left off so
 * clicks always fall through to whatever's above it.
 */
export function HoverPlaygroundVisual() {
  const { active, scrollOffset, setMaxScroll } = useHoverFigTree();
  const isActive = active === "playground";
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const EDGE_MARGIN = "4vw";
  const VERTICAL_MARGIN = "10vw";
  const NON_FULLSCREEN_BOOST = 1.15;

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const recompute = () => {
      const outer = outerRef.current;
      const content = contentRef.current;
      if (!outer || !content) return;
      const fitRatio = outer.clientHeight / content.scrollHeight;
      const nextScale = Math.min(1, fitRatio * NON_FULLSCREEN_BOOST);
      setScale(nextScale);
      const renderedHeight = content.scrollHeight * nextScale;
      setMaxScroll("playground", Math.max(0, renderedHeight - outer.clientHeight));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [setMaxScroll]);

  // Title measured from HoverFigTree's own rendered title (see HoverRadio
  // for the same technique/reasoning) so "PLAYGROUND" lands at the exact
  // same on-screen position/size as "FIG TREE NOTES APP" and "BUILDING
  // RADIO'S FUTURE", regardless of how tall this page's own content is.
  const [titleRect, setTitleRect] = useState<{ top: number; left: number; fontSize: string } | null>(null);
  useEffect(() => {
    const sync = () => {
      const figTitle = document.querySelector('[data-name="hover-fig-tree"] p');
      if (!(figTitle instanceof HTMLElement)) return;
      const rect = figTitle.getBoundingClientRect();
      setTitleRect({ top: rect.top, left: rect.left, fontSize: getComputedStyle(figTitle).fontSize });
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black transition-opacity duration-300"
      style={{ opacity: isActive ? 1 : 0 }}
      aria-hidden={!isActive}
      data-name="hover-playground"
    >
      <p
        className="font-karla absolute shrink-0 whitespace-nowrap font-bold uppercase text-white"
        style={{
          top: titleRect?.top ?? 0,
          left: titleRect?.left ?? 0,
          fontSize: titleRect?.fontSize ?? "3.2vw",
          letterSpacing: "0.32vw",
          lineHeight: 1.1,
          opacity: titleRect ? 1 : 0,
        }}
      >
        PLAYGROUND
      </p>

      <div
        ref={outerRef}
        className="flex h-full w-full flex-col items-center justify-center"
        style={{ padding: `${VERTICAL_MARGIN} ${EDGE_MARGIN}` }}
      >
        <div
          ref={contentRef}
          className="relative w-full"
          style={{
            aspectRatio: `${FRAME.w} / ${FRAME.h}`,
            transform: `translateY(${-(scrollOffset["playground"] ?? 0)}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          {VIDEO_TILES.map(({ name, src, box }) => (
            <div key={name} className="absolute overflow-hidden rounded-[1.5%] bg-black" style={boxStyle(box)}>
              <video src={src} className="h-full w-full object-contain" autoPlay loop playsInline muted />
            </div>
          ))}

          <TextBox box={EXPLORING_BOX} align="left">
            <p className="font-bold">CURRENTLY EXPLORING...</p>
            <p className="mt-[1em]">
              THE INTERSECTION OF MULTIMEDIA, CREATIVE CODING,
              <br />
              NATURE, AND SOUND.
            </p>
          </TextBox>

          <TextBox box={MOSAIC_BOX} align="right">
            <p className="font-bold">WELCOME TO MY MOSAIC OF CREATIVITY</p>
            <MosaicHandles interactive={false} />
          </TextBox>
        </div>
      </div>
    </div>
  );
}

/**
 * Every interactive element overlaid on top of HoverPlaygroundVisual's
 * otherwise-decorative collage — the @handle links in "WELCOME TO MY
 * MOSAIC OF CREATIVITY", and a hit target over each video tile that opens
 * PlaygroundVideoOverlay. Stacked above the Spline canvas (z-6, same
 * reasoning as HoverRadio/HoverFigTree's click-catchers: a click has to
 * reach this before Spline's own pointer handling can claim it) and
 * positioned/sized identically to — but fully transparent over — the
 * visible content rendered in HoverPlaygroundVisual. Computes the same
 * scale-fit math independently rather than sharing state: since both trees
 * size their collage box purely from `aspectRatio` off the same viewport
 * measurements, the same formula always yields the same result.
 */
export function HoverPlaygroundLinks() {
  const { active, scrollOffset, openPlaygroundOverlay } = useHoverFigTree();
  const isActive = active === "playground";
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const recompute = () => {
      const outer = outerRef.current;
      const content = contentRef.current;
      if (!outer || !content) return;
      const fitRatio = outer.clientHeight / content.scrollHeight;
      setScale(Math.min(1, fitRatio * 1.15));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  return (
    <div className="absolute inset-0" style={{ zIndex: 6, pointerEvents: "none" }} data-name="hover-playground-links">
      <div ref={outerRef} className="flex h-full w-full flex-col items-center justify-center" style={{ padding: "10vw 4vw" }}>
        <div
          ref={contentRef}
          className="relative w-full"
          style={{
            aspectRatio: `${FRAME.w} / ${FRAME.h}`,
            transform: `translateY(${-(scrollOffset["playground"] ?? 0)}px) scale(${scale})`,
            transformOrigin: "center",
            visibility: isActive ? "visible" : "hidden",
          }}
        >
          {VIDEO_TILES.map(({ name, box }) => (
            <button
              key={name}
              type="button"
              aria-label={`Open ${name.replace(/-/g, " ")}`}
              className="pointer-events-auto absolute cursor-pointer"
              style={boxStyle(box)}
              onClick={() => openPlaygroundOverlay(name)}
            />
          ))}

          <TextBox box={MOSAIC_BOX} align="right" invisible>
            <p className="font-bold">WELCOME TO MY MOSAIC OF CREATIVITY</p>
            <MosaicHandles interactive />
          </TextBox>
        </div>
      </div>
    </div>
  );
}

/**
 * Invisible full-screen hit target that only turns on while the overlay is
 * active. Mounted above the Spline canvas but below the nav-marker boxes
 * (z-index between the two) so a click on an actual nav box still goes to
 * that box's own Link. This overlay is the only playground experience
 * (there's no standalone destination page to navigate to) — a background
 * click just closes it.
 */
export function HoverPlaygroundClickCatcher() {
  const { active, deactivate, addScroll } = useHoverFigTree();
  const isActive = active === "playground";

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 5, pointerEvents: isActive ? "auto" : "none", cursor: isActive ? "pointer" : undefined }}
      aria-hidden={!isActive}
      onClick={() => deactivate()}
      onWheel={(e) => {
        if (isActive) addScroll("playground", e.deltaY);
      }}
    />
  );
}
