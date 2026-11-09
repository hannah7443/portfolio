"use client";

import { usePathname } from "next/navigation";
import type { HoverOverlayId } from "../spline/HoverFigTreeContext";
import HomeLilyClient from "./HomeLilyClient";

/** The hover screen each of the flower's pages rests on. */
const RESTING: Record<string, HoverOverlayId> = { "/about": "about", "/contact": "contact" };

/** The flower hero for (lily)/layout.tsx, resting on the current path's screen. */
export default function LilyHero() {
  const pathname = usePathname();
  const resting = RESTING[pathname] ?? null;

  return (
    <div data-page={resting ?? "home"} className="relative h-screen w-full bg-black">
      <HomeLilyClient restingOverlay={resting} />
    </div>
  );
}
