"use client";

import { useEffect, useRef, useState } from "react";
import { NameEngine } from "./_lib/engine";
import { buildWords } from "./_lib/letters";
import type { Slot } from "./_lib/types";
import DebugPanel from "./DebugPanel";

// One <canvas>, one requestAnimationFrame loop (spec intro). The loop
// pauses whenever the canvas is offscreen or the tab is hidden. With
// prefers-reduced-motion there is no loop at all: the rest state shows,
// and each click steps to the next style as a still (spec §5).

const REDUCED_MOTION_STILLS: Slot[] = ["rest", "solid", "dots", "crossStitch", "ascii", "outline", "morph"];
/** A fixed moment to sample still frames at, so reduced-motion stills are the same every visit. */
const STILL_TIME = 2;

export default function NameCanvas() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Safe to touch the DOM here: this component is only ever loaded with
  // ssr: false (see NameCanvasClient), and masks are rasterized via canvas.
  const [engine] = useState(() => new NameEngine(buildWords()));
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;

    let raf = 0;
    let last: number | null = null;
    let onScreen = true;

    const frame = (now: number) => {
      engine.tick(last === null ? 0 : (now - last) / 1000);
      last = now;
      engine.draw(ctx);
      raf = requestAnimationFrame(frame);
    };
    const update = () => {
      const shouldRun = !reducedMotion && onScreen && document.visibilityState === "visible";
      if (shouldRun && !raf) raf = requestAnimationFrame(frame);
      if (!shouldRun && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = null;
      }
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = wrap.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      engine.resize(canvas.width, canvas.height, dpr);
      engine.draw(ctx);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(wrap);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    intersectionObserver.observe(canvas);
    document.addEventListener("visibilitychange", update);

    let onClick: (() => void) | undefined;
    if (reducedMotion) {
      let still = 0;
      engine.showStill(REDUCED_MOTION_STILLS[still], STILL_TIME);
      onClick = () => {
        still = (still + 1) % REDUCED_MOTION_STILLS.length;
        engine.showStill(REDUCED_MOTION_STILLS[still], STILL_TIME);
        engine.draw(ctx);
      };
      canvas.addEventListener("click", onClick);
    }

    resize();
    update();

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", update);
      if (onClick) canvas.removeEventListener("click", onClick);
    };
  }, [engine, reducedMotion]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ cursor: reducedMotion ? "pointer" : undefined }}
        role="img"
        aria-label="hannah shin"
      />
      {process.env.NODE_ENV === "development" && <DebugPanel engine={engine} />}
    </div>
  );
}
