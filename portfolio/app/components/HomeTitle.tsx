"use client";

import { useHoverFigTree } from "./spline/HoverFigTreeContext";

/** The "hannah shin" hero title — hidden while the hover-fig-tree overlay is up. */
export default function HomeTitle() {
  const { active } = useHoverFigTree();

  return (
    <p
      className="redaction-50 pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 text-3xl text-white transition-opacity duration-300 sm:text-4xl"
      style={{ opacity: active ? 0 : 1 }}
    >
      hannah shin
    </p>
  );
}
