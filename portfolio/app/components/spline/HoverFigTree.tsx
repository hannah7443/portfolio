"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useHoverFigTree } from "./HoverFigTreeContext";

// Figma "Frame11" (node 396:256), re-laid-out as a responsive two-column
// flex design instead of a fixed-aspect canvas: every size/gap is in `vw`
// so text, videos, and boxes all scale together, and the green background
// panels can bleed off their column's outer edge at any window size/shape
// (not just full-screen). Video layers use the real case-study demo
// footage in place of the design's static screenshots.
const PHILOSOPHICAL_VIDEO = "/fig-tree-demos/philosophical_video.MOV";
const PRODUCT_DEMO_VIDEO = "/fig-tree-demos/product-demo-fig-tree_1.mp4";

const EDGE_MARGIN = "4vw"; // gap kept between content and the screen's left/right edges
const VERTICAL_MARGIN = "10vw"; // set black margin kept above and below all content — safe as-is in full-screen
const BLEED = "60vw"; // comfortably more than half the viewport, so a bg panel always reaches past the real edge
const GREEN = "rgba(121,145,112,0.35)";
// Sum of the 3 fig icons' widths + the 2 gaps between them (5.6 + 5.1 + 6.7
// + 0.8*2 vw) — used to inset the quote/attribution text so its right edge
// stops at the leftmost icon's left edge instead of running underneath them.
const QUOTE_ICONS_WIDTH = "19vw";

/**
 * The visual design itself — sits behind the 3D flower (mount it before
 * <Spline> in the DOM, no z-index, so normal paint order puts Spline's
 * canvas on top of it). Purely decorative: pointer-events are left off so
 * clicks always fall through to whatever's above it.
 */
export function HoverFigTreeVisual() {
  const { active } = useHoverFigTree();
  const outerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Every element's size/position is fixed `vw` — completely unaware of
  // the actual viewport height. That's fine in full-screen (the content
  // fits comfortably), but a non-fullscreen window always has less real vh
  // (menu bar, tabs, dock), so the same fixed-size content can run out of
  // room and clip. Rather than guess when that's the case, this measures
  // it directly: outerRef's real rendered height (padding already
  // subtracted by the browser) vs. contentRef's real rendered height
  // (title + two-column content, at its true 1:1 size) — if content is
  // taller, scale it down by exactly the ratio needed to fit, applied as a
  // single `transform: scale()` on the whole content block. A uniform
  // transform can't distort anything — every element's position/size
  // relative to every other stays pixel-identical, just smaller — which
  // is what a full-screen window's plenty of headroom already gives a
  // scale of 1 (no visible change at all).
  // Nudges the fit-to-space scale up a bit past the exact ratio needed —
  // full-screen is unaffected (its ratio is already >=1, so it's clamped
  // back down to 1 regardless), while a non-fullscreen window renders
  // somewhat larger than a bare "just barely fits" size, at the cost of a
  // little of the safety margin the exact ratio would have kept.
  const NON_FULLSCREEN_BOOST = 1.15;

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const recompute = () => {
      const outer = outerRef.current;
      const content = contentRef.current;
      if (!outer || !content) return;
      const fitRatio = outer.clientHeight / content.scrollHeight;
      setScale(Math.min(1, fitRatio * NON_FULLSCREEN_BOOST));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black transition-opacity duration-300"
      style={{ opacity: active ? 1 : 0 }}
      aria-hidden={!active}
      data-name="hover-fig-tree"
    >
      <div
        ref={outerRef}
        className="flex h-full w-full flex-col items-center justify-center"
        style={{ padding: `${VERTICAL_MARGIN} ${EDGE_MARGIN}` }}
      >
        {/* The title + two-column content, scaled as one unit (see `scale`
            above) — relative alignment between every element inside is
            untouched no matter what the scale ends up being. */}
        <div ref={contentRef} className="w-full" style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        <p
          className="font-karla shrink-0 font-bold uppercase text-white"
          style={{ fontSize: "3.2vw", letterSpacing: "0.32vw", lineHeight: 1.1, marginLeft: "-2vw", marginTop: "1vw" }}
        >
          FIG TREE NOTES APP
        </p>

        {/* items-start (not items-center): with centering, each column's
            top edge drifts depending on the two columns' relative heights,
            so the gap between the title and the product-demo block (top of
            the left column) wasn't a fixed distance. Top-aligning both
            columns makes that gap exactly marginTop, always. */}
        <div className="flex items-start gap-[4vw]" style={{ marginTop: "2.5vw" }}>
          {/* LEFT COLUMN */}
          <div className="flex flex-1 flex-col gap-[1.5vw]">
            {/* product-demo — background bleeds off the left edge, and (via
                paddingBottom on this wrapper, which the bg's inset:0 picks
                up automatically since absolute offsets resolve against the
                padding box) always extends a bit past the video's bottom
                edge instead of cutting off flush against it. */}
            <div className="relative" style={{ marginTop: "0vw", paddingBottom: "1vw" }}>
              <div className="absolute" style={{ top: "-1vw", bottom: 0, left: `-${BLEED}`, right: "-6%", background: GREEN }} />
              <p
                className="font-karla relative mb-[1vw] uppercase text-white"
                style={{ fontSize: "1.7vw", letterSpacing: "0.17vw", marginLeft: "-2vw" }}
              >
                PRODUCT DEMO
              </p>
              <div
                className="relative overflow-hidden rounded-[1.2vw]"
                style={{ aspectRatio: "16 / 9", width: "88%", marginLeft: "-2vw" }}
              >
                <video
                  src={PRODUCT_DEMO_VIDEO}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  data-name="product-demo-video"
                />
              </div>
            </div>

            {/* fig-tree-concept — same width and left offset as the
                product-demo video above so their edges line up. */}
            <div className="border border-white p-[1.4vw]" style={{ width: "88%", marginLeft: "-2vw" }}>
              <p className="font-mono font-bold uppercase text-white" style={{ fontSize: "1.35vw", lineHeight: 1.4 }}>
                Concept:
                <br />
                Productivity, Redefined
              </p>
              <p className="mt-[1vw] font-mono uppercase text-white" style={{ fontSize: "1.15vw", lineHeight: 1.4 }}>
                Fig Tree is a productivity platform where no idea has to die for another to live. Inspired by
                Sylvia Plath&apos;s fig tree analogy, users grow ideas as &quot;figments&quot; across three states:
                unripe, ripening, and ripe.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-1 flex-col gap-[1.5vw]" style={{ marginTop: "1.5vw" }}>
            {/* fig-tree-quote — moved up, rectangle thinned down, icons
                pulled down over its top edge (negative margin + higher
                z-index) so they visibly hang off the top instead of
                sitting fully inside it. */}
            <div className="relative" style={{ marginTop: "-8vw" }}>
              <div className="relative z-[1] flex justify-end gap-[0.8vw]" style={{ marginTop: "0.8vw", marginBottom: "-2.5vw" }}>
                <Image src="/fig-tree-demos/icons/ripening-fig.png" alt="" width={74} height={96} className="h-auto" style={{ width: "5.6vw" }} />
                <Image src="/fig-tree-demos/icons/ripe-fig.png" alt="" width={67} height={95} className="h-auto" style={{ width: "5.1vw" }} />
                <Image
                  src="/fig-tree-demos/icons/fig-cross-section.png"
                  alt=""
                  width={88}
                  height={111}
                  className="relative h-auto"
                  style={{ width: "6.7vw", top: "0.8vw" }}
                />
              </div>
              <div className="relative py-[0.7vw] pl-[1.2vw] pr-[1.2vw]" style={{ marginTop: "-5vw" }}>
                <div className="absolute" style={{ inset: 0, left: "-3.1%", right: `-${BLEED}`, background: GREEN }} />
                <p
                  className="relative text-right font-mono text-white"
                  style={{ fontSize: "1.25vw", paddingRight: QUOTE_ICONS_WIDTH }}
                >
                  &ldquo;I SAW MY LIFE BRANCHING OUT BEFORE ME LIKE THE GREEN FIG&nbsp;TREE...&rdquo;
                </p>
                <p
                  className="relative whitespace-nowrap text-right font-mono text-white"
                  style={{ fontSize: "1.25vw", paddingRight: QUOTE_ICONS_WIDTH }}
                >
                  -SYLVIA PLATH
                </p>
              </div>
            </div>

            {/* right-rectangle tagline — same width/left-offset as the
                philosophical video below so their edges line up. */}
            <div className="border border-white p-[1.4vw]" style={{ width: "88%", marginLeft: "calc(12% + 2vw)" }}>
              <p className="text-right font-mono font-bold text-white" style={{ fontSize: "1.25vw", lineHeight: 1.4 }}>
                GROW EACH BRANCH OF YOUR LIFE.
                <br />
                LET YOUR IDEAS RIPEN.
              </p>
            </div>

            {/* philosophical-inspiration — background bleeds off the right
                edge and (via paddingBottom, picked up by the bg's inset:0
                since absolute offsets resolve against the padding box)
                always extends past the video's bottom edge. Video is
                pushed right by the same 2vw margin the product-demo video
                is pushed left by, and nudged down slightly; label pinned
                right under the video itself. */}
            <div className="relative" style={{ paddingBottom: "1vw" }}>
              <div className="absolute" style={{ inset: 0, left: "-6%", right: `-${BLEED}`, background: GREEN }} />
              <div
                className="relative overflow-hidden rounded-[1.2vw]"
                style={{ aspectRatio: "16 / 9", width: "88%", marginLeft: "calc(12% + 2vw)", marginTop: "1vw" }}
              >
                <video
                  src={PHILOSOPHICAL_VIDEO}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  data-name="philosophical-video"
                />
              </div>
              <p
                className="font-karla relative mt-[1vw] text-right uppercase text-white"
                style={{ fontSize: "1.7vw", letterSpacing: "0.17vw", width: "88%", marginLeft: "calc(12% + 2vw)" }}
              >
                PHILOSOPHICAL INSPIRATION
              </p>
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
 * the fig-tree case study.
 */
export function HoverFigTreeClickCatcher() {
  const { active, deactivate } = useHoverFigTree();
  const router = useRouter();

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 5, pointerEvents: active ? "auto" : "none", cursor: active ? "pointer" : undefined }}
      aria-hidden={!active}
      onClick={() => {
        deactivate();
        router.push("/work/fig-tree");
      }}
    />
  );
}
