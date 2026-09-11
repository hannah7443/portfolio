"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHoverFigTree } from "./HoverFigTreeContext";

// Figma "Frame17" (node 463:1519), re-laid-out the same way HoverFigTree.tsx
// re-lays out its frame: a responsive two-column flex design (instead of a
// fixed-aspect canvas) where every size/gap is in `vw` so text, videos, and
// boxes all scale together, and the blue background panels can bleed off
// their column's outer edge at any window size/shape. Both video layers use
// the same real WXDU website-demo footage (the mobile-listening layer's
// video is a placeholder for now, per the design brief, until a real mobile
// demo clip exists).
const WXDU_WEBSITE_DEMO_VIDEO = "/radio-demos/WXDU-Website-Demo.mov";
const CD_ICON_SOURCE = "/radio-demos/icons/cd-icon-source.png";
const RADIO_HEADER_UNION = "/radio-demos/icons/radio-header-union.svg";
// "Static Rectangle"'s actual source texture (node 463:1534's rawImages,
// not a per-instance flattened export): a 500x500 tile Figma repeats via
// `background-size: 500px 500px` + a translucent gradient tint on top —
// reproduced with the same background layering below instead of a single
// stretched screenshot of one crop of the tile.
const STATIC_NOISE_TILE = "/radio-demos/icons/noise-tile-source.png";
const STATIC_NOISE_TINT = "rgba(218,215,210,0.4)";
const MOBILE_HEADER_TRIANGLE_LEFT = "/radio-demos/icons/mobile-header-polygon1.svg";
const MOBILE_HEADER_TRIANGLE_RIGHT = "/radio-demos/icons/mobile-header-polygon2.svg";

const EDGE_MARGIN = "4vw";
const VERTICAL_MARGIN = "10vw";
const BLEED = "60vw";
const BLUE = "rgba(108,144,192,0.35)";
const INDIGO = "#150859"; // "Current Header" bar fill behind each video

// Layer boxes below are lifted straight from get_metadata on nodes 463:1522
// (Mobile-Listening) and 463:1532 (Radio-website-redesign), expressed
// relative to each node's own frame origin/size — i.e. the exact Figma
// layout, not an approximation. Rendered as `left/top/width/height`
// percentages of an aspect-ratio box the same shape as that frame, so the
// whole card scales as one unit while every layer keeps its precise
// Figma-relative position and size.
type Box = { x: number; y: number; w: number; h: number };
type CardLayout = {
  frame: { w: number; h: number };
  /** "Rectangle 7" — the shadowed card back behind the screenshot/video. */
  shadow: Box;
  shadowImage: string;
  /** "Static Rectangle" — the noise-texture placeholder the video sits over. */
  noise: Box;
  /** "cd-1-Photoroom 1" — the small disc icon in the header. */
  cd: Box;
  /** The header title's baseline position. */
  title: Box;
} & (
  | { headerKind: "union"; union: Box }
  | { headerKind: "split"; bar: Box; triLeft: Box; triRight: Box }
);

const RADIO_LAYOUT: CardLayout = {
  frame: { w: 540.117, h: 356.874 },
  // h extended past the design's own 309 (which only reaches the frame's
  // nominal bottom): the noise/video box below is now sized to the demo
  // video's real 16:10 aspect ratio instead of the "Static Rectangle"
  // placeholder's ratio (see MediaCard), so it now extends to ~381.4 (in
  // these frame-relative units) — this card back needs to reach at least
  // that far to still sit behind it, plus a little extra so it visibly
  // wraps rather than ending flush with it.
  shadow: { x: 0.117, y: 47.874, w: 540, h: 348 },
  shadowImage: "/radio-demos/icons/radio-shadow-card.png",
  noise: { x: 16.117, y: 63.874, w: 508, h: 286 },
  cd: { x: 31.133, y: 3.417, w: 49.022, h: 46.853 },
  title: { x: 88.117, y: 10.874, w: 445, h: 40 },
  headerKind: "union",
  union: { x: 0, y: 0, w: 448.872, h: 55.374 },
};

const MOBILE_LAYOUT: CardLayout = {
  frame: { w: 547.756, h: 304 },
  // Same reasoning as RADIO_LAYOUT.shadow above — extended to reach past
  // the noise/video box's new (video-aspect-driven) bottom at ~384.5.
  // x shifted +6.75 (and noise.x below along with it) so this card-back
  // rectangle's own right edge (was 539) lines up with the right
  // triangle's right corner (460.36+85.39=545.75) instead of sitting to
  // the left of it.
  shadow: { x: 6.75, y: 53, w: 539, h: 346 },
  shadowImage: "/radio-demos/icons/mobile-shadow-card.png",
  noise: { x: 22.75, y: 67, w: 508, h: 224 },
  cd: { x: 169.016, y: 3.543, w: 49.022, h: 46.853 },
  title: { x: 227, y: 14, w: 300, h: 40 },
  headerKind: "split",
  // h extended down from the design's own 51 (top edge unchanged).
  bar: { x: 163, y: 2, w: 339, h: 75 },
  triLeft: { x: 118, y: 0, w: 89.894, h: 71.892 },
  // Scaled down ~15% from the design's own 95.756x76, anchored to the
  // same bottom-right corner (x+w and y+h both still land on 547.756/76)
  // so it shrinks in place instead of drifting.
  triRight: { x: 460.36, y: 2.4, w: 85.39, h: 54.6 },
};

const pct = (v: number, total: number) => `${(v / total) * 100}%`;
const boxStyle = (box: Box, frame: { w: number; h: number }) => ({
  left: pct(box.x, frame.w),
  top: pct(box.y, frame.h),
  width: pct(box.w, frame.w),
  height: pct(box.h, frame.h),
});

/**
 * The "Current Header" + "Rectangle 7" + "Static Rectangle" chrome that sits
 * behind each demo video (nodes 463:1522 and 463:1532), reproduced layer for
 * layer from the design's own assets and exact relative positions/sizes —
 * the shadowed card back, the noise-texture placeholder, the header bar
 * (either the fused "Union" shape or, for Mobile-Listening, a flat bar plus
 * its two separate corner-triangle vectors), and the CD-disc icon — rather
 * than an approximated re-drawing. The video fills the same box the
 * "Static Rectangle" placeholder occupies, in place of the design's static
 * screenshot.
 */
function MediaCard({ layout, title, video }: { layout: CardLayout; title: string; video: string }) {
  const { frame } = layout;
  return (
    <div className="relative w-full" style={{ aspectRatio: `${frame.w} / ${frame.h}` }}>
      <img
        src={layout.shadowImage}
        alt=""
        className="absolute rounded-[3%] object-cover shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        style={boxStyle(layout.shadow, frame)}
      />

      {/* Mobile-Listening's two corner triangles render *before* the noise
          box (so the noise box, and the video padding still visible around
          it, paints over them where the two overlap) — only the indigo bar
          + title stay above the noise box, further down. */}
      {layout.headerKind === "split" && (
        <>
          <img src={MOBILE_HEADER_TRIANGLE_LEFT} alt="" className="absolute" style={boxStyle(layout.triLeft, frame)} />
          <img src={MOBILE_HEADER_TRIANGLE_RIGHT} alt="" className="absolute" style={boxStyle(layout.triRight, frame)} />
        </>
      )}

      {layout.headerKind === "union" ? (
        <img src={RADIO_HEADER_UNION} alt="" className="absolute" style={boxStyle(layout.union, frame)} />
      ) : (
        <div className="absolute" style={{ ...boxStyle(layout.bar, frame), background: INDIGO }} />
      )}

      {/* Static Rectangle/noise box renders after (on top of) the header
          bar/union above — it now overlaps and covers the bottom of that
          header shape (the extended MOBILE_LAYOUT.bar included) instead of
          being covered by it. */}
      <div
        className="absolute overflow-hidden rounded-[1%] shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        style={{
          ...boxStyle(layout.noise, frame),
          // Height overridden to the demo footage's own aspect ratio
          // (2880x1800 = 16/10) instead of the "Static Rectangle"
          // placeholder's own (wider) proportions: with `object-contain`
          // keeping the whole video visible, a box wider than the video
          // itself pillarboxes it, which — combined with the padding
          // below — made the left/right gap read as much bigger than the
          // top/bottom gap. Matching the box to the video's own ratio
          // means `object-contain` needs no letterboxing at all, so the
          // padding is the *only* gap, and it comes out equal on all four
          // sides (percentage padding always resolves against width, on
          // every side, top/bottom included).
          height: "auto",
          aspectRatio: "16 / 10",
          backgroundImage: `linear-gradient(90deg, ${STATIC_NOISE_TINT} 0%, ${STATIC_NOISE_TINT} 100%), url(${STATIC_NOISE_TILE})`,
          backgroundSize: "auto, 500px 500px",
          backgroundPosition: "top left",
          backgroundRepeat: "repeat",
          padding: "2%",
        }}
      >
        <video src={video} className="h-full w-full object-contain" autoPlay muted loop playsInline data-name="hover-radio-video" />
      </div>

      {/* CD disc — node 463:1541's own crop of its background-removed source
          photo (genuinely transparent outside the disc, not a flattened
          export + manual circular mask): an overflow-hidden box at the
          node's size, with the source image scaled/offset by the exact
          percentages Figma uses to frame just the disc. */}
      <div className="absolute overflow-hidden" style={boxStyle(layout.cd, frame)}>
        <img
          src={CD_ICON_SOURCE}
          alt=""
          className="pointer-events-none absolute max-w-none"
          style={{ left: "-37.83%", top: "-121.06%", width: "176.99%", height: "277.78%" }}
        />
      </div>

      {/* top is the CD icon's own vertical center (cd.y + cd.h/2), with
          translateY(-50%) centering the text's own box on that same line
          — so the title sits at the CD's center height instead of an
          independently-tuned offset. */}
      <p
        className="font-karla absolute whitespace-nowrap uppercase text-white"
        style={{
          left: pct(layout.title.x, frame.w),
          top: pct(layout.cd.y + layout.cd.h / 2, frame.h),
          transform: "translateY(-50%)",
          fontSize: "1.4vw",
          letterSpacing: "0.18vw",
        }}
      >
        {title}
      </p>
    </div>
  );
}

// "vertical-vinyl" (node 463:1586) layer boxes, lifted from get_metadata,
// relative to that node's own frame origin (886, 44) and size
// (368.730 x 528) — the exact Figma layout. Each vinyl-part image is
// downloaded per-layer (not one flattened whole-cluster export, which read
// blurry) and had its photographed-white backdrop keyed out to real alpha
// transparency, since Figma's own export doesn't carry that.
// Every y below is shifted up 35 (and the frame shortened by the same
// amount) from the raw Figma values, so the backdrop plate — the vinyl
// player's actual visible top edge — starts at y=0 of this container
// instead of 35px down inside a taller, partly-empty frame. That lets a
// plain `items-start` alignment with the stakeholders box next to it line
// their top edges up directly, instead of the stakeholders box sitting
// visibly higher than the plate. slider-vinyl's knobs, which originally
// overhung above the plate, now poke a bit above this container's own top
// edge — matching the original design intent, just expressed as a
// negative offset instead of extra empty frame space.
const VINYL_FRAME = { w: 368.730224609375, h: 493 };
const VINYL_BACKDROP = { x: 60, y: 0, w: 293, h: 398 }; // "Rectangle 17"
const VINYL_SLIDER = { x: 0, y: -35, w: 368.730224609375, h: 279.596923828125 }; // "slider-vinyl 1"
const VINYL_NOTCH = { x: 62.393, y: -4.976, w: 254.264, h: 192.809 }; // "notch-vinyl 1"
const VINYL_BUTTONS = { x: 59.579, y: -17.642, w: 300.238, h: 227.993 }; // "buttons-vinyl 1"
const VINYL_STICK = { x: 66, y: -12, w: 300, h: 228 }; // "Vinyl Stick" (tonearm, static)
const VINYL_TEXT_PLATE = { x: 66, y: 216, w: 279, h: 174 }; // "Rectangle 18"
// "CD that rotates" + the "Mask group" WXDU sticker on top of it — these two
// spin together as one rigid unit, so the sticker's box below is expressed
// relative to the CD's own box (not the cluster frame), for positioning
// inside the same rotating wrapper.
const VINYL_CD = { x: 26, y: -6, w: 327, h: 216 };
const VINYL_STICKER_IN_CD = { x: (152.933 - 26), y: (103.676 - 29), w: 72.714, h: 72.714 };

/**
 * The turntable/vinyl illustration cluster (node 463:1586) reproduced layer
 * by layer at each part's own exact position/size, instead of one
 * low-resolution flattened export of the whole group. The CD photo and its
 * WXDU sticker are wrapped together in one rotating box so they spin in
 * place as a single unit.
 */
function VinylCluster() {
  return (
    // `container-type: inline-size` lets the caption below size itself in
    // `cqw` (percent of *this* box's own rendered width) instead of the
    // page-wide `vw` the rest of the design uses — this cluster is scaled
    // down a lot relative to the viewport (40% of a half column), so a
    // `vw` font-size was sized for the full page and overflowed well past
    // the dark rectangle meant to contain it.
    <div className="relative w-full" style={{ aspectRatio: `${VINYL_FRAME.w} / ${VINYL_FRAME.h}`, containerType: "inline-size" }}>
      <div className="absolute bg-[#d9d9d9]" style={boxStyle(VINYL_BACKDROP, VINYL_FRAME)} />
      <img src="/radio-demos/icons/slider-vinyl.png" alt="" className="absolute" style={boxStyle(VINYL_SLIDER, VINYL_FRAME)} />
      <img src="/radio-demos/icons/notch-vinyl.png" alt="" className="absolute" style={boxStyle(VINYL_NOTCH, VINYL_FRAME)} />
      <img src="/radio-demos/icons/buttons-vinyl.png" alt="" className="absolute" style={boxStyle(VINYL_BUTTONS, VINYL_FRAME)} />

      {/* CD + its WXDU label sticker, spinning together in place. */}
      <div className="absolute animate-[spin_6s_linear_infinite]" style={boxStyle(VINYL_CD, VINYL_FRAME)}>
        <img src="/radio-demos/icons/cd-rotates.png" alt="" className="absolute inset-0 h-full w-full" />
        <img src="/radio-demos/icons/wxdu-sticker.png" alt="" className="absolute rounded-full" style={boxStyle(VINYL_STICKER_IN_CD, VINYL_CD)} />
      </div>

      <img src="/radio-demos/icons/vinyl-stick.png" alt="" className="absolute" style={boxStyle(VINYL_STICK, VINYL_FRAME)} />

      <div className="absolute overflow-hidden bg-[#2a1717]" style={boxStyle(VINYL_TEXT_PLATE, VINYL_FRAME)}>
        <p
          className="font-mono flex h-full w-full min-w-0 items-center justify-center text-center uppercase text-white"
          style={{ fontSize: "5.0cqw", lineHeight: 1.4, padding: "8%" }}
        >
          A 10-week full-stack design engineering internship @ Duke office of information technology
        </p>
      </div>
    </div>
  );
}

/**
 * The visual design itself — sits behind the 3D flower (mount it before
 * <Spline> in the DOM, no z-index, so normal paint order puts Spline's
 * canvas on top of it). Purely decorative: pointer-events are left off so
 * clicks always fall through to whatever's above it.
 */
export function HoverRadioVisual() {
  const { active, scrollOffset, setMaxScroll } = useHoverFigTree();
  const isActive = active === "radio";
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Same fit-to-space scaling as HoverFigTreeVisual: every element below is
  // sized in fixed `vw` units, unaware of real viewport height, so a
  // non-fullscreen window (less real vh than full-screen) can run out of
  // room. This measures the real rendered content height against the real
  // available height and applies a single uniform `transform: scale()` to
  // fit, which can't distort relative positions — just shrinks everything
  // together. Full-screen already has plenty of headroom, so its ratio
  // clamps back to 1 (no visible change).
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
      // Reports any remaining overflow (BOOST intentionally overshoots
      // "just barely fits", and this column is tall enough that it still
      // can) to a shared scroll offset (see HoverFigTreeContext) that
      // HoverRadioClickCatcher's wheel handler drives, instead of clipping
      // it.
      const renderedHeight = content.scrollHeight * nextScale;
      setMaxScroll("radio", Math.max(0, renderedHeight - outer.clientHeight));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [setMaxScroll]);

  // The title is intentionally kept OUT of `contentRef`'s scaled/centered
  // block below. Radio's two-column content is much taller than
  // HoverFigTree's, so centering a block that includes the title makes the
  // title's on-screen position drift with however tall the rest of the
  // content happens to be (verified: HoverFigTree's content is ~730px vs.
  // Radio's ~1035px at 1440x900, which alone accounts for ~140px of vertical
  // drift). Instead, this measures HoverFigTree's own rendered title
  // (present in the DOM at all times, just opacity:0 when inactive, so its
  // layout is always current) and pins Radio's title at that exact
  // viewport position — guaranteed to match regardless of viewport size,
  // and without touching HoverFigTree.tsx at all.
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
      data-name="hover-radio"
    >
      {/* Title — same font/style as HoverFigTree's "FIG TREE NOTES APP",
          pinned to that exact viewport position (see effect above). */}
      <p
        className="font-karla absolute shrink-0 font-bold uppercase text-white"
        style={{
          top: titleRect?.top ?? 0,
          left: titleRect?.left ?? 0,
          fontSize: titleRect?.fontSize ?? "3.2vw",
          letterSpacing: "0.32vw",
          lineHeight: 1.1,
          opacity: titleRect ? 1 : 0,
        }}
      >
        BUILDING RADIO&apos;S FUTURE
      </p>

      <div
        ref={outerRef}
        className="flex h-full w-full flex-col items-center justify-center"
        style={{ padding: `${VERTICAL_MARGIN} ${EDGE_MARGIN}` }}
      >
        <div
          ref={contentRef}
          className="w-full"
          style={{ transform: `translateY(${-(scrollOffset["radio"] ?? 0)}px) scale(${scale})`, transformOrigin: "center" }}
        >
          <div className="flex items-start gap-[4vw]" style={{ marginTop: "2.5vw" }}>
            {/* LEFT COLUMN */}
            <div className="flex flex-1 flex-col gap-[1.5vw]" style={{ marginTop: "9vw" }}>
              {/* radio-website-redesign demo — bg bleeds off the left edge.
                  paddingBottom is bigger than MediaCard's own box: since
                  the noise/video box inside it was widened past the
                  card's nominal aspect ratio (to match the video's 16:10
                  ratio, see MediaCard), it now overflows below the card's
                  own fixed-aspect bounds — this extra padding (and the
                  blue rect's bottom:0 tracking it) extends far enough
                  down to wrap that overflow instead of cutting it off. */}
              <div className="relative" style={{ paddingBottom: "5vw", marginTop: "1.2vw" }}>
                <div className="absolute" style={{ top: "-1vw", bottom: "1vw", left: `-${BLEED}`, right: "-6%", background: BLUE }} />
                <div className="relative" style={{ width: "88%", marginLeft: "-2vw" }}>
                  <MediaCard layout={RADIO_LAYOUT} title="RADIO WEBSITE REDESIGN" video={WXDU_WEBSITE_DEMO_VIDEO} />
                </div>
              </div>

              {/* deliverables — same treatment as fig-tree-concept box. */}
              <div className="border border-white p-[1.4vw]" style={{ width: "88%", marginLeft: "-2vw", marginTop: "-1vw" }}>
                <p className="font-mono font-bold uppercase text-white" style={{ fontSize: "1.35vw", lineHeight: 1.4 }}>
                  Deliverables:
                </p>
                <ul
                  className="font-mono uppercase text-white"
                  style={{ fontSize: "1.15vw", lineHeight: 1.4, marginTop: "1vw", paddingLeft: "1.2vw", listStyleType: "disc" }}
                >
                  <li>WXDU website redesign</li>
                  <ul style={{ paddingLeft: "1.2vw", listStyleType: "disc" }}>
                    <li>based on UX interviews</li>
                  </ul>
                  <li>New WXDU mobile listening app</li>
                  <li>Vision language model - album alt text</li>
                </ul>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="flex flex-1 flex-col gap-[0.1vw]" style={{ marginTop: "-1.5vw" }}>
              {/* stakeholders + vinyl/CD decoration, side by side as their
                  own two columns (the vinyl cluster scaled up bigger than
                  its old stacked-below size, made room for by shrinking
                  the stakeholders box to a flex column instead of the full
                  row width). */}
              <div
                className="flex items-start gap-[1.5vw]"
                style={{ width: "88%", marginLeft: "calc(12% + 2vw)", transform: "translate(-2.6vw, 4.5vw)" }}
              >
                {/* aspectRatio (not alignSelf: stretch, which matched the
                    full vinyl cluster frame including its empty margins)
                    ties this box's height to its own width so it comes out
                    close to the vinyl cluster's "Rectangle 17" backdrop
                    plate height specifically: plate is 398/493 of the
                    cluster's height, and the cluster is rendered ~10%
                    wider than this box (flex-basis 55% vs. 50% of the same
                    row), so plate-height ≈ (50/55) × (493/398) × this
                    box's own width ≈ this box's width ÷ 0.84. */}
                <div className="border border-white p-[1vw] text-right" style={{ flex: "0 0 50%", aspectRatio: "0.84" }}>
                  <p className="font-mono font-bold uppercase text-white" style={{ fontSize: "1.35vw", lineHeight: 1.4 }}>
                    Stakeholders:
                  </p>
                  <p className="font-mono uppercase text-white" style={{ fontSize: "1.15vw", lineHeight: 1.4, marginTop: "1vw" }}>
                    WXDU: Duke&apos;s radio station
                    <br />
                    WXYC - UNC&apos;s radio station
                  </p>
                </div>

                <div style={{ flex: "0 0 55%", marginRight: "4.5vw", transform: "translateX(-2.5vw)" }}>
                  <VinylCluster />
                </div>
              </div>

              {/* mobile-listening-app demo — same video as the website
                  redesign above (placeholder until a real mobile-app demo
                  clip is recorded), bg bleeds off the right edge.
                  paddingBottom is bigger than MediaCard's own box for the
                  same reason as the radio-website-redesign block above —
                  this card's noise/video box overflows its nominal frame
                  by even more (its placeholder was proportioned much
                  wider than the video's actual 16:10 ratio). */}
              <div className="relative" style={{ paddingBottom: "9vw", marginTop: "0vw" }}>
                <div className="absolute" style={{ inset: 0, left: "-6%", right: `-${BLEED}`, background: BLUE }} />
                <div className="relative" style={{ width: "88%", marginLeft: "calc(12% + 2vw)", marginTop: "1.5vw" }}>
                  <MediaCard layout={MOBILE_LAYOUT} title="MOBILE LISTENING APP" video={WXDU_WEBSITE_DEMO_VIDEO} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Invisible full-screen hit target that only turns on while the overlay is
 * active. Mounted above the Spline canvas but below the nav-marker boxes
 * (z-index between the two) so a click on an actual nav box still goes to
 * that box's own Link, while a click anywhere else on the page navigates to
 * the full-stack case study.
 */
export function HoverRadioClickCatcher() {
  const { active, deactivate, addScroll } = useHoverFigTree();
  const isActive = active === "radio";
  const router = useRouter();

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 5, pointerEvents: isActive ? "auto" : "none", cursor: isActive ? "pointer" : undefined }}
      aria-hidden={!isActive}
      onClick={() => {
        deactivate();
        router.push("/full-stack");
      }}
      // Sits above the Spline canvas so clicks reach it instead of Spline's
      // own camera controls — which also means it's the element that has
      // to forward scroll-wheel input down to HoverRadioVisual (kept
      // behind the canvas so the flower still occludes it), via the shared
      // scroll offset.
      onWheel={(e) => {
        if (isActive) addScroll("radio", e.deltaY);
      }}
    />
  );
}
