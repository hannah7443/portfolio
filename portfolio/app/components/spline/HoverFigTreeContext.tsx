"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";

// Shared "which hover overlay is showing" state. It's lifted out of
// NavPreviewBox (which only knows about its own single marker) so any nav
// marker's hover can set the matching full-screen background sticky, while
// the overlay components and their click-catchers — all siblings under
// FlowerScene — can read it. Only one overlay id can be active at a time:
// activating a new one simply replaces the old id, which is exactly the
// "stays up until you hover another nav marker" behavior each overlay wants.
export type HoverOverlayId = "fig-tree" | "radio" | "playground" | "about";

type HoverFigTreeContextValue = {
  /** id of the currently-active overlay, or null if none is showing. */
  active: HoverOverlayId | null;
  activate: (id: HoverOverlayId) => void;
  deactivate: () => void;
  /**
   * How far each overlay's content is scrolled (in real screen px, already
   * post-scale), keyed by overlay id. A ClickCatcher (the full-screen layer
   * that actually receives wheel events, since it sits above the Spline
   * canvas) reports wheel deltas via `addScroll`; the matching Visual
   * component reads its own `scrollOffset[id]` back to shift its content —
   * the two are separate DOM elements (Visual must stay behind the Spline
   * canvas, ClickCatcher above it) with no direct prop channel, so this
   * context is what connects them.
   */
  scrollOffset: Partial<Record<HoverOverlayId, number>>;
  /** Visual calls this whenever it remeasures, so `addScroll` always clamps against the current content height. */
  setMaxScroll: (id: HoverOverlayId, max: number) => void;
  /** ClickCatcher calls this with a wheel event's deltaY. */
  addScroll: (id: HoverOverlayId, delta: number) => void;
  /**
   * Which HoverPlayground video tile (by name) the "click a video" detail
   * overlay is showing for, or null when it's closed. Lives here (rather
   * than local state in one component) for the same reason as
   * `scrollOffset` above: the thing that has to detect the click (a hit
   * target stacked above the Spline canvas) and the thing that renders the
   * overlay (mounted at the very top of FlowerScene, above everything) are
   * different components.
   */
  playgroundOverlayTile: string | null;
  openPlaygroundOverlay: (name: string) => void;
  closePlaygroundOverlay: () => void;
  /**
   * Sticks true the first time the playground overlay is activated, and
   * never resets. HoverPlaygroundVisual uses this to defer its video
   * tiles' `src` until the first real hover instead of loading ~170MB of
   * video the instant the homepage mounts — lives here (an event-handler
   * setState, not an effect) rather than local state in that component,
   * since a ref/effect-derived "has this ever been true" value runs afoul
   * of this repo's stricter ref-during-render / setState-in-effect lint.
   */
  playgroundEverActivated: boolean;
};

const HoverFigTreeContext = createContext<HoverFigTreeContextValue | null>(null);

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

export function HoverFigTreeProvider({ children }: { children: ReactNode }) {
  const [active, setActiveState] = useState<HoverOverlayId | null>(null);
  const [scrollOffset, setScrollOffset] = useState<Partial<Record<HoverOverlayId, number>>>({});
  const maxScrollRef = useRef<Partial<Record<HoverOverlayId, number>>>({});
  const [playgroundOverlayTile, setPlaygroundOverlayTile] = useState<string | null>(null);
  const [playgroundEverActivated, setPlaygroundEverActivated] = useState(false);

  const activate = (id: HoverOverlayId) => {
    setActiveState(id);
    // Start each fresh activation scrolled to the top, rather than wherever
    // it was left the last time this overlay was shown.
    setScrollOffset((prev) => ({ ...prev, [id]: 0 }));
    if (id === "playground") setPlaygroundEverActivated(true);
  };

  const setMaxScroll = (id: HoverOverlayId, max: number) => {
    maxScrollRef.current[id] = max;
    setScrollOffset((prev) => {
      const current = prev[id] ?? 0;
      const next = clamp(current, 0, max);
      return next === current ? prev : { ...prev, [id]: next };
    });
  };

  const addScroll = (id: HoverOverlayId, delta: number) => {
    const max = maxScrollRef.current[id] ?? 0;
    setScrollOffset((prev) => ({ ...prev, [id]: clamp((prev[id] ?? 0) + delta, 0, max) }));
  };

  return (
    <HoverFigTreeContext.Provider
      value={{
        active,
        activate,
        deactivate: () => setActiveState(null),
        scrollOffset,
        setMaxScroll,
        addScroll,
        playgroundOverlayTile,
        openPlaygroundOverlay: setPlaygroundOverlayTile,
        closePlaygroundOverlay: () => setPlaygroundOverlayTile(null),
        playgroundEverActivated,
      }}
    >
      {children}
    </HoverFigTreeContext.Provider>
  );
}

export function useHoverFigTree() {
  const ctx = useContext(HoverFigTreeContext);
  if (!ctx) throw new Error("useHoverFigTree must be used within a HoverFigTreeProvider");
  return ctx;
}
