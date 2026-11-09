"use client";

import { LiquidGlass } from "apple-liquid-glass-webgl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GLASS } from "./lily/GlassWindows";

// The case-study section nav, from Figma "Nav-Bar" (file MAeeEAh3liNy9GGgvPD6eK,
// node 1053:1726) with each section's glass pane stretched out behind its
// label, as in "overview-glass" (1053:1773, a 204×44 pane) and its label
// (1053:1783): a white spine running down through one outlined square per
// section, each with a glass pane over its top-right corner that carries the
// label. The active section's pane turns solid white with black text.
// Used by /work/fig-tree and /work/radio. Sections are spaced evenly (the
// Figma's six average ~101px apart), so any number of them fits; the whole
// nav scales by --s to fit the viewport height. Coordinates are Figma px.
// The panes use the homepage's glass (apple-liquid-glass-webgl, same settings
// as GlassWindows). Its default `backdrop: 'auto'` paints the squares and spine
// underneath, so the panes bend them like the Figma Glass does.

/** A label may wrap onto a second line with "\n". */
export type NavItem = { id: string; label: string };

type Box = { x: number; y: number };
type Line = Box & { length: number };

const SQUARE_SIZE = 40;
const SQUARE_BORDER = 2;
/** The small decorative panes on the end caps. */
const CAP_PANE = { width: 48.36, height: 43.964 };
/** Where the top end cap and its pane sit. */
const TOP_CAP = { square: { x: 0, y: 0 }, glass: { x: 15.39, y: 19.78 } };
/** The first section's square, and the distance from each section's square to the next. */
const FIRST_SQUARE = { x: 18, y: 104 };
const SECTION_STEP = 101.2;
/** A section's pane sits this far left/up of its square's top-left: x 36.64, y −18 in the Figma. */
const PANE_OFFSET = { x: 18.64, y: -18 };
/** From the last section's square to the bottom end cap (Figma: REFLECTION at 610, cap at 717). */
const BOTTOM_CAP_GAP = 107;
const BOTTOM_CAP_PANE_OFFSET = { x: 15.39, y: -23.7 };
/** Spine x between sections (the squares' centre line), and for the two short end links (Figma). */
const SPINE_X = 38;
const TOP_LINK_X = 24.18;
const BOTTOM_LINK_X = 25.36;
const SPINE_WIDTH = 3.64;
/** Widest the nav gets, in Figma px (labels ending ~275px in, plus room). */
const FRAME_WIDTH = 303.08;

/**
 * A section's pane (Figma px): 44 tall around a 38px line of text (25px per
 * line when the label wraps), with the text starting 64.23px in — past the
 * square's corner — and 8.8px of glass after it, as in the 204px OVERVIEW pane.
 */
const PANE_PADDING = { top: 3, right: 8.8, bottom: 3, left: 64.23 };

/** Frost as a ratio of the pane's short side — light, so the bent lines stay legible. */
const PANE_FROST = 0.2;
/** Largest scale (Figma px → page px), and the room kept free above and below the nav. */
const MAX_SCALE = 0.62;
const MIN_SCALE = 0.4;
const VERTICAL_ROOM = 120;

const px = (n: number) => `calc(${n}px * var(--s))`;
const at = ({ x, y }: Box): CSSProperties => ({ left: px(x), top: px(y) });

function layout(count: number) {
  const squares = Array.from({ length: count }, (_, i) => ({ x: FIRST_SQUARE.x, y: FIRST_SQUARE.y + i * SECTION_STEP }));
  const last = squares[squares.length - 1] ?? FIRST_SQUARE;
  const bottomCap = { x: 0, y: last.y + BOTTOM_CAP_GAP };
  const spine: Line[] = [
    { x: TOP_LINK_X, y: TOP_CAP.square.y + 63.7, length: FIRST_SQUARE.y - 63.7 },
    ...squares.slice(1).map((sq, i) => ({ x: SPINE_X, y: squares[i].y + SQUARE_SIZE, length: sq.y - squares[i].y - SQUARE_SIZE })),
    { x: BOTTOM_LINK_X, y: last.y + SQUARE_SIZE, length: bottomCap.y - last.y - SQUARE_SIZE + 2 },
  ];
  return {
    squares,
    panes: squares.map((sq) => ({ x: sq.x + PANE_OFFSET.x, y: sq.y + PANE_OFFSET.y })),
    caps: [
      TOP_CAP,
      { square: bottomCap, glass: { x: bottomCap.x + BOTTOM_CAP_PANE_OFFSET.x, y: bottomCap.y + BOTTOM_CAP_PANE_OFFSET.y } },
    ],
    spine,
    height: bottomCap.y + SQUARE_SIZE,
  };
}

/**
 * Scroll-spy for the nav: the last section whose top has scrolled past the
 * upper ~35% of the viewport is active — so a nav click (which lands the
 * section at its scroll-mt) always marks the section it jumped to. At the
 * very bottom of the page the last section wins, since it may never reach
 * that line.
 */
export function useActiveSection<Id extends string>(ids: readonly Id[]): Id {
  const [activeId, setActiveId] = useState<Id>(ids[0]);
  // Keyed on the ids' contents (a fresh array arrives every render), so renaming a section re-runs it.
  const idsKey = ids.join(" ");
  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const update = () => {
      const line = window.innerHeight * 0.35;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      const passed = sections.filter((section) => section.getBoundingClientRect().top <= line);
      const current = atBottom ? sections[sections.length - 1] : (passed[passed.length - 1] ?? sections[0]);
      if (current) setActiveId(current.id as Id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- idsKey stands in for ids
  }, [idsKey]);
  return activeId;
}

export default function GlassSectionNav({ items, activeId }: { items: readonly NavItem[]; activeId: string }) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const paneRefs = useRef<(HTMLElement | null)[]>([]);
  const { squares, panes, caps, spine, height } = layout(items.length);
  const [scale, setScale] = useState(MAX_SCALE);

  // Shrink to fit short viewports.
  useEffect(() => {
    const fit = () => setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, (window.innerHeight - VERTICAL_ROOM) / height)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [height]);

  // One LiquidGlass on the pane layer draws every pane on a single shared canvas, behind the
  // labels and refracting the squares and spine in the layer beneath it. Rebuilt when the
  // sections change, since a renamed section remounts its link and the old one leaves the glass.
  const itemsKey = items.map((item) => `${item.id}:${item.label}`).join(" ");
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const targets = paneRefs.current.flatMap((element) =>
      element ? [{ element, frost: PANE_FROST, shape: "rect" as const, radius: 0 }] : [],
    );
    const glass = new LiquidGlass(board, { targets, ...GLASS });
    return () => glass.destroy();
  }, [itemsKey]);

  return (
    <nav aria-label="Case study sections" className="fixed left-10 top-24 z-20 hidden md:block md:left-16">
      <div className="relative" style={{ width: px(FRAME_WIDTH), height: px(height), ["--s" as string]: scale }}>
        {/* Squares and spine: a layer of their own under the glass, so the glass's backdrop picks them up. */}
        <div aria-hidden="true" className="absolute inset-0">
          {spine.map((line, i) => (
            <div
              key={i}
              className="absolute bg-white"
              style={{ ...at(line), width: px(SPINE_WIDTH), height: px(line.length) }}
            />
          ))}
          {[...caps.map((cap) => cap.square), ...squares].map((square) => (
            <div
              key={`${square.x},${square.y}`}
              className="absolute border-solid border-white"
              style={{ ...at(square), width: px(SQUARE_SIZE), height: px(SQUARE_SIZE), borderWidth: px(SQUARE_BORDER) }}
            />
          ))}
        </div>

        {/* The panes. The section panes are the links themselves, so their labels sit on the glass. */}
        <div ref={boardRef} className="pointer-events-none absolute inset-0">
          {caps.map((cap, i) => (
            <div
              key={`cap-${i}`}
              ref={(el) => {
                paneRefs.current[i] = el;
              }}
              aria-hidden="true"
              className="glass-window absolute"
              style={{ ...at(cap.glass), width: px(CAP_PANE.width), height: px(CAP_PANE.height) }}
            />
          ))}
          <ul>
            {items.map((item, i) => {
              const active = item.id === activeId;
              return (
                <li key={item.id}>
                  <a
                    ref={(el) => {
                      paneRefs.current[caps.length + i] = el;
                    }}
                    href={`#${item.id}`}
                    aria-current={active ? "location" : undefined}
                    className={`glass-window font-ibm-plex-mono pointer-events-auto absolute block whitespace-pre font-medium uppercase transition-colors duration-300 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                      active ? "text-black" : "text-[#888] hover:text-white"
                    }`}
                    style={{
                      ...at(panes[i]),
                      // Solid white over the glass when active; inline so it also beats the no-WebGL fallback's tint.
                      backgroundColor: active ? "#fff" : undefined,
                      // Figma: IBM Plex Mono Medium 28.929px, tracking -1.157px.
                      fontSize: px(28.929),
                      letterSpacing: "-0.04em",
                      lineHeight: item.label.includes("\n") ? px(25) : px(38),
                      padding: `${px(PANE_PADDING.top)} ${px(PANE_PADDING.right)} ${px(PANE_PADDING.bottom)} ${px(PANE_PADDING.left)}`,
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
