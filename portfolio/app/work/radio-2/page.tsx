import { BackToProjects, Sidebar, Section, type NavItem } from "../../components/ArchiveColumn";

const NAV_ITEMS: NavItem[] = [
  { label: "Live Website", id: "live-website" },
  { label: "Final Presentation", id: "final-presentation" },
];

export default function Radio2Page() {
  return (
    <div className="flex min-h-screen">
      <BackToProjects />
      <Sidebar items={NAV_ITEMS} />
      <main className="ml-56 flex-1 px-12 pt-24">
        <Section id="live-website" title="Live Website">
          <p className="font-red-hat-mono text-black">
            View the live website here:{" "}
            <a href="https://wxdu.art/" target="_blank" rel="noopener noreferrer" className="underline">
              https://wxdu.art/
            </a>
          </p>
          <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row">
            <video
              src="/radio-demos/WXDU-Website.mov"
              className="w-full max-w-[860px] rounded-[18px]"
              autoPlay
              loop
              muted
              playsInline
            />
            <video
              src="/radio-demos/WXDU-Mobile.mov"
              className="w-full max-w-[220px] rounded-[18px]"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </Section>
        <Section id="final-presentation" title="Final Presentation">
          <p className="font-red-hat-mono text-black">
            This was presented on July 21st, 2026. Details about the context of the project, UX research methods and
            insights, and my contributions are in the presentation. View it here:{" "}
            <a
              href="https://www.figma.com/deck/E6Bo97gtTnccktIld4FnoI"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              https://www.figma.com/deck/E6Bo97gtTnccktIld4FnoI
            </a>
          </p>
          <embed
            src="/radio-demos/Final%20Presentation.pdf"
            type="application/pdf"
            className="mt-6 h-[80vh] w-full rounded-[18px]"
          />
        </Section>
      </main>
    </div>
  );
}
