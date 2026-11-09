import HomeLilyClient from "../components/lily/HomeLilyClient";

// A direct link to the CONTACT window's screen: the homepage with LET'S CONNECT (Figma "About",
// node 1071:2908) open bottom-right over the "hannah shin" letters. On the homepage the window
// itself just opens that screen, on hover or click, without coming here.
export default function ContactPage() {
  return (
    <div data-page="contact" className="relative h-screen w-full bg-black">
      <HomeLilyClient restingOverlay="contact" />
    </div>
  );
}
