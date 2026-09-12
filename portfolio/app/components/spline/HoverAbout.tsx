"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHoverFigTree } from "./HoverFigTreeContext";
import { NameTitle, RepeatingWordLines } from "./HomeBackground";

// Figma "About-belt-1" through "About-belt-5" (nodes 411:1285, 532:239,
// 532:240, 411:1298, 411:1293) — a continuously-scrolling belt of photo
// clusters + captions, inserted between the "HANNAH SHIN"/subtitle and the
// 4 repeating word-lines that the home page's background (HomeBackground)
// already renders — this page reuses those same two pieces (NameTitle,
// RepeatingWordLines) rather than re-authoring them, per the brief ("same
// elements as the main page").
type BeltImage = { src: string; ratio: string };
type BeltCluster = { caption: string; images: BeltImage[] };

const CLUSTERS: BeltCluster[] = [
  { caption: "HI, NICE TO MEET YOU!", images: [{ src: "/about-belt/1-nyc-portrait.jpg", ratio: "430 / 260" }] },
  {
    caption: "DUKE STUDENT",
    images: [
      { src: "/about-belt/2-duke-chapel.jpg", ratio: "203 / 256" },
      { src: "/about-belt/2-garden-portrait.jpg", ratio: "192 / 256" },
    ],
  },
  {
    caption: "FIGMA CAMPUS LEADER",
    images: [
      { src: "/about-belt/3-figma-campus-leader-card.png", ratio: "258 / 258" },
      { src: "/about-belt/3-figma-campus-leaders-group.png", ratio: "213 / 261" },
    ],
  },
  {
    caption: "COLLEGE RADIO DJ",
    images: [
      { src: "/about-belt/4-radio-booth.jpg", ratio: "191 / 255" },
      { src: "/about-belt/4-wxdu-storefront.jpg", ratio: "341 / 256" },
    ],
  },
  { caption: "PIANIST", images: [{ src: "/about-belt/5-pianist-hands.jpg", ratio: "448 / 257" }] },
];

function Cluster({ caption, images }: BeltCluster) {
  return (
    <div className="flex shrink-0 flex-col items-center" style={{ gap: "0.8vw", marginRight: "4vw" }}>
      <div className="flex" style={{ gap: "0.6vw" }}>
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- decorative belt photo, not the LCP image
          <img
            key={i}
            src={img.src}
            alt=""
            className="shrink-0 rounded-[1vw] object-cover"
            style={{ height: "15vw", aspectRatio: img.ratio }}
          />
        ))}
      </div>
      <p className="font-mono whitespace-nowrap uppercase text-white" style={{ fontSize: "1vw" }}>
        {caption}
      </p>
    </div>
  );
}

/**
 * The continuously-scrolling belt: the track renders the 5 clusters twice
 * back to back and animates exactly one copy's width (-50%, via the
 * `belt-scroll` keyframes in globals.css) so the loop is seamless — the
 * clusters read in order 1→5, then it wraps right back to 1 without a jump.
 */
function PhotoBelt() {
  return (
    // Full-bleed to the actual viewport edges: this sits inside the page's
    // EDGE_MARGIN-padded content column (like every other cluster here),
    // so a plain 100% width would stop at that padding — the classic
    // full-bleed trick (100vw width, pulled back by half the viewport
    // minus half its own container) escapes it on both sides instead.
    <div className="overflow-hidden" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
      {/* Inline `animation` (not a Tailwind arbitrary class) + translate3d
          in the keyframes + will-change: both halves of the track are
          identical, so `-50%` always lands exactly on the seam between
          them — this just makes sure the browser renders that seam on its
          own GPU-composited layer instead of re-rasterizing the row on
          every frame, which is what reads as a "jump"/reset at the loop
          point on a long, wide row like this one. */}
      <div className="flex" style={{ width: "max-content", animation: "belt-scroll 46s linear infinite", willChange: "transform" }}>
        {[...CLUSTERS, ...CLUSTERS].map((cluster, i) => (
          <Cluster key={i} {...cluster} />
        ))}
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
export function HoverAboutVisual() {
  const { active, scrollOffset, setMaxScroll } = useHoverFigTree();
  const isActive = active === "about";
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // NameTitle is rendered separately below, absolutely positioned at the
  // exact same spot HomeBackground puts it (top-[4vh], no scale) — so it
  // always matches the home page exactly instead of drifting with however
  // much this page's own scale-fit shrink happens to apply. This spacer
  // reserves the same amount of space inside the scaled flex column that
  // NameTitle used to occupy there, so removing it from the flow doesn't
  // make the belt/lines below jump up to fill the gap.
  const titleRef = useRef<HTMLDivElement | null>(null);
  const [titleHeight, setTitleHeight] = useState(0);

  // Same fit-to-space scaling as the other hover overlays — see
  // HoverFigTree.tsx for the full reasoning.
  const NON_FULLSCREEN_BOOST = 1.15;
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const recompute = () => {
      const outer = outerRef.current;
      const content = contentRef.current;
      if (!outer || !content) return;
      setTitleHeight(titleRef.current?.offsetHeight ?? 0);
      const fitRatio = outer.clientHeight / content.scrollHeight;
      const nextScale = Math.min(1, fitRatio * NON_FULLSCREEN_BOOST);
      setScale(nextScale);
      const renderedHeight = content.scrollHeight * nextScale;
      setMaxScroll("about", Math.max(0, renderedHeight - outer.clientHeight));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [setMaxScroll]);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black transition-opacity duration-300"
      style={{ opacity: isActive ? 1 : 0 }}
      aria-hidden={!isActive}
      data-name="hover-about"
    >
      {/* Same position as HomeBackground's own "HANNAH SHIN" — deliberately
          outside the scaled/centered block below. */}
      <div ref={titleRef} className="absolute left-1/2 top-[4vh] -translate-x-1/2">
        <NameTitle />
      </div>

      <div
        ref={outerRef}
        className="flex h-full w-full flex-col items-center justify-start"
        style={{ padding: "3vh 4vw" }}
      >
        <div
          ref={contentRef}
          className="flex w-full flex-col items-center"
          style={{
            gap: "3.5vw",
            transform: `translateY(${-(scrollOffset["about"] ?? 0)}px) scale(${scale})`,
            transformOrigin: "center",
          }}
        >
          <div aria-hidden style={{ height: titleHeight, width: "100%" }} />
          <PhotoBelt />
          <RepeatingWordLines />
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
 * the about page.
 */
export function HoverAboutClickCatcher() {
  const { active, deactivate, addScroll } = useHoverFigTree();
  const isActive = active === "about";
  const router = useRouter();

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 5, pointerEvents: isActive ? "auto" : "none", cursor: isActive ? "pointer" : undefined }}
      aria-hidden={!isActive}
      onClick={() => {
        deactivate();
        router.push("/about");
      }}
      onWheel={(e) => {
        if (isActive) addScroll("about", e.deltaY);
      }}
    />
  );
}
