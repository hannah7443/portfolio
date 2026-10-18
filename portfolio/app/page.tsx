import HomeLilyClient from "./components/lily/HomeLilyClient";

// The Spline flower (components/spline/FlowerScene.tsx) and its hover screens are kept in the
// repo; only the playground and about screens are still shown, via their glass windows.
export default function Home() {
  return (
    <div data-page="home" className="relative h-screen w-full bg-black">
      <HomeLilyClient />
    </div>
  );
}
