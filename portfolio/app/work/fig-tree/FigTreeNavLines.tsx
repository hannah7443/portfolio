"use client";

import { LiquidGlass } from "apple-liquid-glass-webgl";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { GLASS } from "../../components/lily/GlassWindows";

// Not currently used: the previous fig tree nav, kept for reference.
// components/GlassSectionNav (the glass extends behind each label) replaced it.
//
// Figma "Nav-Bar" (file MAeeEAh3liNy9GGgvPD6eK, node 1053:1726, 303×757): a
// white spine running down through one outlined square per section, each with
// a glass pane over its top-right corner and a label centred beside the pair.
// The active section's square fills white, and a white line sweeps out from it
// under the label, turning the label white with black text as it passes.
// Coordinates are Figma px from the frame's top-left; the whole nav scales by
// --s so it fits the viewport height.
// The panes use the homepage's glass (apple-liquid-glass-webgl, same settings
// as GlassWindows). Its default `backdrop: 'auto'` paints the squares and spine
// underneath, so the panes bend them like the Figma Glass does.

export type NavItem = { id: string; label: string };

type Box = { x: number; y: number };
type Square = Box & { border: number };
type Line = Box & { length: number };
type Section = {
  square: Square;
  glass: Box;
  /** The label's left edge; it's centred vertically on the square and its glass pane. */
  labelX: number;
  /** Where the active line starts and how far it runs; it sits along the label's bottom edge. */
  line: { x: number; length: number };
};

const FRAME = { width: 303.08, height: 757 };
const GLASS_PANE = { width: 48.36, height: 43.964 };
const SQUARE_SIZE = 40;

/** Per section id, in the order the Figma draws them top to bottom. */
const SECTIONS: Record<string, Section> = {
  overview: { square: { x: 18, y: 104, border: 1.837 }, glass: { x: 36.64, y: 86 }, labelX: 95, line: { x: 58, length: 183 } },
  problem: { square: { x: 18, y: 203, border: 1.837 }, glass: { x: 36.64, y: 185.39 }, labelX: 95, line: { x: 58, length: 170 } },
  concept: { square: { x: 20, y: 298, border: 2.198 }, glass: { x: 38.21, y: 282 }, labelX: 96.57, line: { x: 60, length: 169.57 } },
  // Figma draws CHALLENGES (the active example) 25px further right to clear its turned square; here
  // every label shares one column so nothing shifts as the active section changes.
  challenges: { square: { x: 24.57, y: 401.57, border: 2.198 }, glass: { x: 40.21, y: 385 }, labelX: 96.57, line: { x: 58, length: 221 } },
  "design-highlights": { square: { x: 20, y: 498, border: 2.19 }, glass: { x: 38.21, y: 489 }, labelX: 96.57, line: { x: 44, length: 233 } },
  reflection: { square: { x: 26, y: 610, border: 1.912 }, glass: { x: 40.21, y: 593 }, labelX: 98.57, line: { x: 65.57, length: 212.44 } },
};

/** Label box heights (Figma px): a 38px line (25px per line when wrapped) plus the 1.808px stroke top and bottom. */
const LABEL_BORDER = 1.808;
const labelHeight = (label: string) =>
  label.includes("\n") ? label.split("\n").length * 25 + 2 * LABEL_BORDER : 38 + 2 * LABEL_BORDER;
/** Top of the label, centred between the top of the glass pane and the bottom of the square. */
const labelTop = (s: Section, label: string) =>
  (Math.min(s.glass.y, s.square.y) + Math.max(s.glass.y + GLASS_PANE.height, s.square.y + SQUARE_SIZE)) / 2 -
  labelHeight(label) / 2;

/** The unlabeled squares that cap the spine at the top and bottom. */
const END_CAPS: { square: Square; glass: Box }[] = [
  { square: { x: 0, y: 0, border: 2.198 }, glass: { x: 15.39, y: 19.78 } },
  { square: { x: 0, y: 717, border: 2.198 }, glass: { x: 15.39, y: 693.3 } },
];

/** The spine's vertical segments, linking each square to the next. */
const SPINE: Line[] = [
  { x: 24.18, y: 63.7, length: 40.34 },
  { x: 38, y: 143, length: 61 },
  { x: 37, y: 242, length: 57 },
  { x: 41, y: 338, length: 61 },
  { x: 42.57, y: 441.57, length: 64.43 }, // from the CHALLENGES square's bottom (Figma only shows it turned, its corner closing the gap)
  { x: 40.49, y: 538, length: 72.01 },
  { x: 25.36, y: 648, length: 71 },
];
const SPINE_WIDTH = 3.64;
const UNDERLINE_WIDTH = 3;

/** Frost as a ratio of the pane's short side — light, so the bent lines stay legible. */
const PANE_FROST = 0.2;
/** Largest scale (Figma px → page px), and the room kept free above and below the nav. */
const MAX_SCALE = 0.62;
const MIN_SCALE = 0.4;
const VERTICAL_ROOM = 120;
/** How long the line takes to sweep out; the glass repaints every frame meanwhile. */
const ACTIVATE_MS = 400;

const px = (n: number) => `calc(${n}px * var(--s))`;
const at = ({ x, y }: Box): CSSProperties => ({ left: px(x), top: px(y) });

export default function FigTreeNavLines({ items, activeId }: { items: readonly NavItem[]; activeId: string }) {
  const boardRef = useRef<HTMLDivElement | null>(null);
  const paneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [scale, setScale] = useState(MAX_SCALE);

  // Shrink to fit short viewports.
  useEffect(() => {
    const fit = () =>
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, (window.innerHeight - VERTICAL_ROOM) / FRAME.height)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // One LiquidGlass on the pane layer draws every pane on a single shared canvas, refracting the
  // squares and spine in the layer beneath it.
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const targets = paneRefs.current.flatMap((element) =>
      element ? [{ element, frost: PANE_FROST, shape: "rect" as const, radius: 0 }] : [],
    );
    const glass = new LiquidGlass(board, { targets, ...GLASS });
    return () => glass.destroy();
  }, []);

  // The library only repaints once a transition ends; repaint every frame while the square fills.
  useEffect(() => {
    let frame = 0;
    const end = performance.now() + ACTIVATE_MS + 50;
    const tick = () => {
      LiquidGlass.refreshAll();
      if (performance.now() < end) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [activeId]);

  const panes: Box[] = [...END_CAPS.map((c) => c.glass), ...items.map((item) => SECTIONS[item.id].glass)];

  return (
    <nav aria-label="Case study sections" className="fixed left-10 top-24 z-20 hidden md:block md:left-16">
      <div
        className="relative"
        style={{ width: px(FRAME.width), height: px(FRAME.height), ["--s" as string]: scale }}
      >
        {/* Squares and spine: a layer of their own under the glass, so the glass's backdrop picks them up. */}
        <div aria-hidden="true" className="absolute inset-0">
          {SPINE.map((line, i) => (
            <div
              key={i}
              className="absolute bg-white"
              style={{ ...at(line), width: px(SPINE_WIDTH), height: px(line.length) }}
            />
          ))}
          {[...END_CAPS.map((cap) => ({ key: `cap-${cap.square.y}`, square: cap.square, active: false })),
            ...items.map((item) => ({ key: item.id, square: SECTIONS[item.id].square, active: item.id === activeId })),
          ].map(({ key, square, active }) => (
            <div
              key={key}
              className={`absolute border-solid border-white transition-colors duration-300 ease-out ${
                active ? "bg-white" : "bg-transparent"
              }`}
              style={{ ...at(square), width: px(SQUARE_SIZE), height: px(SQUARE_SIZE), borderWidth: px(square.border) }}
            />
          ))}
        </div>

        <div ref={boardRef} aria-hidden="true" className="pointer-events-none absolute inset-0">
          {panes.map((pane, i) => (
            <div
              key={i}
              ref={(el) => {
                paneRefs.current[i] = el;
              }}
              className="glass-window absolute"
              style={{ ...at(pane), width: px(GLASS_PANE.width), height: px(GLASS_PANE.height) }}
            />
          ))}
        </div>

        <ul>
          {items.map((item) => {
            const s = SECTIONS[item.id];
            const active = item.id === activeId;
            const top = labelTop(s, item.label);
            const height = labelHeight(item.label);
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active ? "location" : undefined}
                  className={`${LABEL} absolute bg-black text-[#9d9d9d] transition-colors duration-300 outline-none hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                  style={{ ...LABEL_STYLE(item.label), left: px(s.labelX), top: px(top) }}
                >
                  {item.label}
                </a>
                {/* The active state: a white line along the label's bottom edge and a white copy of the
                    label with black text, revealed left to right from the square so the label turns
                    white as the line reaches it. Overruns the line's end so a long label shows whole. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute ease-out"
                  style={{
                    left: px(s.line.x),
                    top: px(top),
                    width: px(s.line.length),
                    height: px(height),
                    clipPath: active ? "inset(0 -40% 0 0)" : "inset(0 100% 0 0)",
                    transition: `clip-path ${ACTIVATE_MS}ms ease-out`,
                  }}
                >
                  <span
                    className={`${LABEL} absolute bg-white text-black`}
                    style={{ ...LABEL_STYLE(item.label), left: px(s.labelX - s.line.x), top: 0 }}
                  >
                    {item.label}
                  </span>
                  <span
                    className="absolute left-0 bg-white"
                    style={{ bottom: 0, width: "100%", height: px(UNDERLINE_WIDTH) }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

const LABEL = "font-ibm-plex-mono block whitespace-pre border-solid border-black font-medium uppercase";
// Figma: IBM Plex Mono Medium 28.929px, tracking -1.157px, 7.232px side padding, 1.808px black stroke.
const LABEL_STYLE = (label: string): CSSProperties => ({
  fontSize: px(28.929),
  letterSpacing: "-0.04em",
  lineHeight: label.includes("\n") ? px(25) : px(38),
  padding: `0 ${px(7.232)}`,
  borderWidth: px(LABEL_BORDER),
});
