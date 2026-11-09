import type { ReactNode } from "react";
import LilyHero from "../components/lily/LilyHero";

// /, /about and /contact share one flower: kept in this layout, it stays mounted while moving
// between them, so clicking ABOUT keeps the screen up instead of reloading the flower and
// replaying the name intro. The pages render nothing; the path picks the resting screen.
export default function LilyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LilyHero />
      {children}
    </>
  );
}
