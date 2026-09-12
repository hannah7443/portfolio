"use client";

import { useState } from "react";
import { useHoverFigTree } from "./HoverFigTreeContext";
import { VIDEO_TILES } from "./HoverPlayground";

// Figma "Example-Click" (526:155, the black detail box + video + copy),
// "Rectangle 421" (526:154, the liquid-glass backdrop), and "Toggle-Button"
// (526:167, the FINAL PIECE / HOW I BUILT THIS pill) — the modal that opens
// when a HoverPlayground video tile is clicked. Unlike the hover overlays,
// this sits at the very top of the stack (above the nav-marker boxes too),
// since it's a real modal rather than a background layer the flower
// occludes.
type Mode = "final" | "how-built";

type TileContent = { title: string; lines: string[] };

// September-Rain's copy is the design's own real content; every other tile
// gets a placeholder (per the brief — "you can put placeholders for now").
const FINAL_PIECE_CONTENT: Record<string, TileContent> = {
  "september-rain": {
    title: "DANCING IN THE RAIN",
    lines: [
      "SONG: SEPTEMBER RAIN BY MAKOTO MATSUSHITA",
      "",
      "DNA",
      "ASCII RAIN ART:",
      "CODED FRAMES W/ FIGURE DETECTION",
      "",
      "HAND-DRAWN MIXED-MEDIA STOP-MOTION ANIMATION",
      "",
      "ORIGINAL FILM",
    ],
  },
};

const PLACEHOLDER_CONTENT: TileContent = {
  title: "PLACEHOLDER TITLE",
  lines: ["PLACEHOLDER DESCRIPTION OF THIS PIECE GOES HERE.", "", "PLACEHOLDER", "MORE PLACEHOLDER DETAIL GOES HERE."],
};

const HOW_BUILT_CONTENT: TileContent = {
  title: "HOW I BUILT THIS",
  lines: ["PLACEHOLDER WRITE-UP OF THE PROCESS/TOOLS GOES HERE.", "", "PLACEHOLDER", "MORE PLACEHOLDER DETAIL GOES HERE."],
};

function ToggleTabs({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div
      className="relative mx-auto flex overflow-hidden rounded-full bg-[#454040]"
      style={{ width: "min(32vw, 460px)", height: "3.2vw", maxHeight: "46px" }}
    >
      {/* The lighter "thumb" pill — slides between halves via transform,
          same sliding-pill pattern as the design's overlapping gray pill. */}
      <div
        className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-[rgba(255,252,252,0.4)] transition-transform duration-300 ease-out"
        style={{ transform: mode === "how-built" ? "translateX(100%)" : "translateX(0%)" }}
      />
      {(["final", "how-built"] as Mode[]).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className="font-karla relative z-[1] flex-1 font-bold uppercase text-white"
          style={{ fontSize: "min(1vw, 14px)" }}
        >
          {tab === "final" ? "Final Piece" : "How I Built This"}
        </button>
      ))}
    </div>
  );
}

export function PlaygroundVideoOverlay() {
  const { playgroundOverlayTile, closePlaygroundOverlay } = useHoverFigTree();
  const [mode, setMode] = useState<Mode>("final");

  if (!playgroundOverlayTile) return null;

  const tile = VIDEO_TILES.find((t) => t.name === playgroundOverlayTile);
  if (!tile) return null;

  const content = mode === "final" ? (FINAL_PIECE_CONTENT[tile.name] ?? PLACEHOLDER_CONTENT) : HOW_BUILT_CONTENT;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      data-name="playground-video-overlay"
      onClick={() => {
        closePlaygroundOverlay();
        setMode("final");
      }}
    >
      {/* "Rectangle 421" — a liquid-glass layer over the whole playground
          page: light blur + a touch of saturation, with the design's own
          translucent tint on top, so the page is still clearly visible
          underneath. Clicking anywhere on it (i.e. outside the black box
          below) closes the overlay. */}
      <div className="absolute inset-0 backdrop-blur-[6px] backdrop-saturate-125">
        <div className="absolute inset-0 bg-[rgba(217,217,217,0.15)]" />
      </div>

      {/* The black detail box — stopPropagation so a click inside it never
          reaches the backdrop's close handler. */}
      <div
        className="relative flex flex-col items-center gap-[2vw] rounded-[2vw] bg-black/60 p-[2vw]"
        style={{ width: "80vw", maxWidth: "1100px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <ToggleTabs mode={mode} onChange={setMode} />

        <div className="flex w-full items-start gap-[3vw]">
          <div
            className="relative flex-1 overflow-hidden rounded-[1vw] bg-black"
            style={{ aspectRatio: "694 / 390" }}
          >
            <video
              key={`${tile.name}-${mode}`}
              src={tile.src}
              className="h-full w-full object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>

          <div className="flex-1 font-mono text-right uppercase text-white" style={{ fontSize: "1vw", lineHeight: 1.6 }}>
            <p className="font-bold">{content.title}</p>
            {content.lines.map((line, i) => (
              <p key={i} className={line === "" ? "h-[1em]" : undefined}>
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
