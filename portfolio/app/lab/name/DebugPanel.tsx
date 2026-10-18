"use client";

import { useEffect, useState } from "react";
import type { NameEngine } from "./_lib/engine";
import { LOOP_SECONDS } from "./_lib/timeline";
import type { StyleId } from "./_lib/types";

// Dev-only debug panel (spec §5): 1–6 force a unified style, 0 resumes
// the timeline, Space pauses, holding F freezes t until released, the
// slider scrubs t, and toggles show the grid and each letter's active style. The engine is mutated directly;
// this component only polls it to keep its readout current.

/** Keys 1–6, in spec §3 order. */
const KEY_STYLES: StyleId[] = ["solid", "dots", "crossStitch", "ascii", "outline", "morph"];

export default function DebugPanel({ engine }: { engine: NameEngine }) {
  const [, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 100);
    // Hold F to freeze t; releasing restores whatever pause state came before.
    let pausedBeforeFreeze: boolean | null = null;
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "f" || pausedBeforeFreeze === null) return;
      engine.setPaused(pausedBeforeFreeze);
      pausedBeforeFreeze = null;
      setTick((n) => n + 1);
    };
    const onKey = (e: KeyboardEvent) => {
      // Leave typing alone; the panel's own slider and checkboxes still take the shortcuts.
      if (e.target instanceof HTMLInputElement && !["range", "checkbox"].includes(e.target.type)) return;
      if (e.key.toLowerCase() === "f") {
        if (pausedBeforeFreeze === null) {
          pausedBeforeFreeze = engine.paused;
          engine.setPaused(true);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        engine.togglePause();
      } else if (e.key === "0") {
        engine.setForced(null);
      } else if (e.key >= "1" && e.key <= "6") {
        engine.setForced(KEY_STYLES[Number(e.key) - 1]);
      } else return;
      setTick((n) => n + 1);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [engine]);

  const toggle = (key: keyof NameEngine["debug"]) => {
    engine.toggleDebug(key);
    refresh();
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 w-72 rounded-md bg-black/80 p-3 font-mono text-[11px] leading-relaxed text-white">
      <div className="flex justify-between">
        <span>
          loop {engine.loopIndex} · {engine.phase}
        </span>
        <span>{engine.paused ? "paused" : "playing"}</span>
      </div>
      <div>
        unified: {engine.plan().unifiedStyle} · forced: {engine.forced ?? "—"}
      </div>
      <input
        type="range"
        min={0}
        max={LOOP_SECONDS}
        step={0.01}
        value={engine.loopTime}
        onChange={(e) => {
          engine.setPaused(true);
          engine.scrubTo(Number(e.target.value));
          refresh();
        }}
        className="my-2 w-full"
        aria-label="Scrub time"
      />
      <div className="mb-2">t = {engine.loopTime.toFixed(2)}s</div>
      <div className="flex gap-3">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={engine.debug.showGrid} onChange={() => toggle("showGrid")} /> grid
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={engine.debug.showLabels} onChange={() => toggle("showLabels")} /> labels
        </label>
      </div>
      <div className="mt-2 opacity-60">
        1 solid · 2 dots · 3 stitch · 4 ascii · 5 outline · 6 morph · 0 timeline · space pause · hold F freeze
      </div>
    </div>
  );
}
