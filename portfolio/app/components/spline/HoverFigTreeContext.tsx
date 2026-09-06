"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Shared "is the hover-fig-tree overlay showing" flag. It's lifted out of
// NavPreviewBox (which only knows about its own single marker) so the
// fig-tree marker's hover can set it sticky, while the full-screen overlay
// and its click-catcher — both siblings under FlowerScene — can read it.
type HoverFigTreeContextValue = {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
};

const HoverFigTreeContext = createContext<HoverFigTreeContextValue | null>(null);

export function HoverFigTreeProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  return (
    <HoverFigTreeContext.Provider
      value={{ active, activate: () => setActive(true), deactivate: () => setActive(false) }}
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
