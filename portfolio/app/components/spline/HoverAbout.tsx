"use client";

import AboutLayout, { AboutConnect } from "../about/AboutLayout";
import { useHoverFigTree } from "./HoverFigTreeContext";

// The ABOUT window's hover screen: Figma "About" (node 1069:1995), shared with /about via
// AboutLayout. It has no background of its own, so the "hannah shin" letters behind it stay
// visible, as in the Figma.

/**
 * The visual design itself — sits behind the 3D flower (mount it before
 * the flower's canvas in the DOM, no z-index, so normal paint order puts the
 * canvas on top of it). Purely decorative: pointer-events are left off so
 * clicks always fall through to whatever's above it.
 */
export function HoverAboutVisual() {
  const { active } = useHoverFigTree();
  const isActive = active === "about";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-300"
      style={{ opacity: isActive ? 1 : 0 }}
      aria-hidden={!isActive}
      data-name="hover-about"
    >
      <AboutLayout />
    </div>
  );
}

/**
 * Invisible full-screen hit target that only turns on while the about or
 * contact screen is up. Mounted above the Spline canvas but below the nav-marker boxes
 * (z-index between the two) so a click on an actual nav box still goes to
 * that box's own Link. A click here just closes the overlay, same as
 * playground; the ABOUT window itself is what opens /about.
 */
export function HoverAboutClickCatcher() {
  const { active, deactivate } = useHoverFigTree();
  const isActive = active !== null && CONNECT_SCREENS.includes(active);

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 5, pointerEvents: isActive ? "auto" : "none", cursor: isActive ? "pointer" : undefined }}
      aria-hidden={!isActive}
      onClick={() => deactivate()}
    />
  );
}

/** The screens LET'S CONNECT shows on: about's, and CONTACT's, which is LET'S CONNECT alone. */
const CONNECT_SCREENS = ["about", "contact"];

/**
 * LET'S CONNECT's links, above the click-catcher (z-5) so they can be clicked, and below the
 * glass windows (z-10). Only reachable while the about or contact screen shows.
 */
export function HoverAboutLinks() {
  const { active } = useHoverFigTree();
  const isActive = active !== null && CONNECT_SCREENS.includes(active);

  return (
    <div
      className="pointer-events-none absolute inset-0 transition-opacity duration-300"
      style={{ zIndex: 6, opacity: isActive ? 1 : 0 }}
      inert={!isActive}
    >
      <AboutConnect />
    </div>
  );
}
