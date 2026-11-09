import HomeLilyClient from "../components/lily/HomeLilyClient";

// The ABOUT window's page: the homepage flower with its about screen (Figma "About", node
// 1069:1995) open, over the "hannah shin" letters. The flower's windows work as on the homepage;
// closing another window's screen comes back to the about screen.
export default function AboutPage() {
  return (
    <div data-page="about" className="relative h-screen w-full bg-black">
      <HomeLilyClient restingOverlay="about" />
    </div>
  );
}
