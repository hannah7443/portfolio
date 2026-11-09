"use client";

import { useSyncExternalStore } from "react";
import NameCanvas, { type NameCanvasVariant } from "./NameCanvas";

// The canvas builds its masks with browser canvas APIs on first render, so it only renders in the
// browser. It's bundled with the page rather than loaded as its own chunk (next/dynamic), so the
// letters start as soon as the page hydrates instead of waiting behind the flower's three.js chunks.
const subscribe = () => () => {};

export default function NameCanvasClient({ variant }: { variant?: NameCanvasVariant }) {
  const isBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  return isBrowser ? <NameCanvas variant={variant} /> : null;
}
