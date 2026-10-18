"use client";

import dynamic from "next/dynamic";
import NameCanvasClient from "../../lab/name/NameCanvasClient";

// WebGL can't run during SSR, so the lily loads client-only (ssr: false has to live in a Client Component).
const FlowerThree = dynamic(() => import("./FlowerThree"), { ssr: false });

/** The homepage hero: the three.js lily and its glass nav windows, over the "hannah shin" name strip. */
export default function HomeLilyClient() {
  return (
    <FlowerThree
      background={
        // Full width along the bottom of the screen, behind the flower (as it was behind the Spline one).
        <div className="pointer-events-none absolute inset-x-0 bottom-0">
          <NameCanvasClient variant="strip" />
        </div>
      }
    />
  );
}
