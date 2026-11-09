"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import NameCanvasClient from "../../lab/name/NameCanvasClient";
import type { HoverOverlayId } from "../spline/HoverFigTreeContext";

// WebGL can't run during SSR, so the lily loads client-only (ssr: false has to live in a Client Component).
const FlowerThree = dynamic(() => import("./FlowerThree"), { ssr: false });

/** The intro holds at least this long, so a cached lily doesn't make it flash past. */
const MIN_INTRO_MS = 1500;
/**
 * /about and /contact skip the intro, unless the lily is still loading after this long. Setting up
 * even an already-downloaded lily takes about a second, which the flower's fade-in covers.
 */
const LOAD_GRACE_MS = 2000;
/** The name's slide from the middle of the screen down to its strip. */
const SLIDE = "transform 1100ms cubic-bezier(0.65, 0, 0.35, 1)";

/**
 * The homepage hero: the three.js lily and its glass nav windows, over the "hannah shin" name strip.
 * While the lily loads, the name plays alone in the middle of the black screen; once it's ready
 * (and the intro has held for a moment) the name slides down into place and the flower fades in.
 * /about and /contact are this same hero with the about or contact screen open (`restingOverlay`);
 * they only play the intro if the lily takes a while to load.
 */
export default function HomeLilyClient({ restingOverlay = null }: { restingOverlay?: HoverOverlayId | null }) {
  const skipIntro = restingOverlay !== null;
  const [loaded, setLoaded] = useState(false);
  const [minHeld, setMinHeld] = useState(skipIntro);
  // Whether the intro plays at all: from the start on the homepage, after LOAD_GRACE_MS otherwise.
  const [introPlays, setIntroPlays] = useState(!skipIntro);
  const loadedRef = useRef(false);
  const onReady = useCallback(() => {
    loadedRef.current = true;
    setLoaded(true);
  }, []);
  const intro = introPlays && !(loaded && minHeld);
  const revealed = loaded && (!introPlays || minHeld);

  useEffect(() => {
    if (!skipIntro) {
      const t = setTimeout(() => setMinHeld(true), MIN_INTRO_MS);
      return () => clearTimeout(t);
    }
    // Still loading after the grace: play the intro after all, held for its usual minimum.
    let hold: ReturnType<typeof setTimeout> | undefined;
    const t = setTimeout(() => {
      if (loadedRef.current) return;
      setIntroPlays(true);
      setMinHeld(false);
      hold = setTimeout(() => setMinHeld(true), MIN_INTRO_MS);
    }, LOAD_GRACE_MS);
    return () => {
      clearTimeout(t);
      clearTimeout(hold);
    };
    // Decided once, on mount: moving between /, /about and /contact keeps this component mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FlowerThree
      onReady={onReady}
      revealed={revealed}
      restingOverlay={restingOverlay}
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
