"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import NameCanvasClient from "../../lab/name/NameCanvasClient";

// WebGL can't run during SSR, so the lily loads client-only (ssr: false has to live in a Client Component).
const FlowerThree = dynamic(() => import("./FlowerThree"), { ssr: false });

/** The intro holds at least this long, so a cached lily doesn't make it flash past. */
const MIN_INTRO_MS = 1500;
/** The name's slide from the middle of the screen down to its strip. */
const SLIDE = "transform 1100ms cubic-bezier(0.65, 0, 0.35, 1)";

/**
 * The homepage hero: the three.js lily and its glass nav windows, over the "hannah shin" name strip.
 * While the lily loads, the name plays alone in the middle of the black screen; once it's ready
 * (and the intro has held for a moment) the name slides down into place and the flower fades in.
 */
export default function HomeLilyClient() {
  const [loaded, setLoaded] = useState(false);
  const [minHeld, setMinHeld] = useState(false);
  const onReady = useCallback(() => setLoaded(true), []);
  const intro = !(loaded && minHeld);

  useEffect(() => {
    const t = setTimeout(() => setMinHeld(true), MIN_INTRO_MS);
    return () => clearTimeout(t);
  }, []);

  return (
    <FlowerThree
      onReady={onReady}
      revealed={!intro}
      background={
        // Full width along the bottom of the screen, behind the flower (as it was behind the Spline one).
        // During the intro it's lifted to the vertical middle: half its own height, less half the screen.
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 motion-reduce:transition-none!"
          style={{ transform: intro ? "translateY(calc(50% - 50vh))" : "none", transition: SLIDE }}
        >
          <NameCanvasClient variant="strip" />
        </div>
      }
    />
  );
}
