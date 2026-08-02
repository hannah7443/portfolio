import { BackToProjects, Sidebar, Section, type NavItem } from "../../components/ArchiveColumn";
import VideoPlayer from "../../components/VideoPlayer";

const NAV_ITEMS: NavItem[] = [
  { label: "Fig Tree", id: "fig-tree" },
  { label: "Concept", id: "concept" },
  { label: "Built With", id: "built-with" },
  { label: "Process", id: "process" },
  { label: "Try It", id: "try-it" },
];

export default function FigTreePage() {
  return (
    <div className="flex min-h-screen">
      <BackToProjects />
      <Sidebar items={NAV_ITEMS} />
      <main className="ml-56 flex-1 px-12 pt-24">
        <Section id="fig-tree" title="Fig Tree" titleClassName="text-5xl">
          <VideoPlayer src="/fig-tree-demos/Fig-Tree-Demo.MP4" className="mb-6 w-full" />
          <blockquote className="font-red-hat-mono border-l-2 border-black/40 pl-4 italic text-black">
            &ldquo;I saw my life branching out before me like the green fig tree&hellip;I wanted each and every one
            of them, but choosing one meant losing all the rest.&rdquo; &mdash; Sylvia Plath, The Bell Jar
          </blockquote>
          <p className="font-red-hat-mono mt-4 text-black">
            Sylvia Plath&rsquo;s fig tree analogy has always resonated with me &mdash; but to her, every path not
            taken withered the moment she chose another. Fig Tree flips this idea on its head.
          </p>
          <p className="font-red-hat-mono mt-4 text-black">
            Fig Tree is a platform where no idea has to die for another to live.
          </p>
          <p className="font-red-hat-mono mt-4 text-black">Built for the Config Makeathon 2026 by Figma.</p>
        </Section>

        <Section id="concept" title="Concept">
          <p className="font-red-hat-mono text-black">
            Plant a fig tree for any area of your life, then grow each idea on it as a figment. Every figment moves
            through three states:
          </p>
          <ul className="font-red-hat-mono mt-4 list-disc space-y-2 pl-6 text-black">
            <li>
              <span className="font-semibold">Unripe</span> &mdash; a newly formed idea or brain dump
            </li>
            <li>
              <span className="font-semibold">Ripening</span> &mdash; a work in progress
            </li>
            <li>
              <span className="font-semibold">Ripe</span> &mdash; ready for action
            </li>
          </ul>
          <p className="font-red-hat-mono mt-4 text-black">
            Users can also build a sub-branch off of any fig tree to further grow their ideas.
          </p>
        </Section>

        <Section id="built-with" title="Built With">
          <ul className="font-red-hat-mono list-disc space-y-2 pl-6 text-black">
            <li>
              <span className="font-semibold">Figma Design</span> &mdash; complete design system including
              components, color tokens, and typography
            </li>
            <li>
              <span className="font-semibold">Figma Make</span> &mdash; live interactive prototype
            </li>
            <li>
              <span className="font-semibold">Procreate + Adobe Illustrator + Photoshop</span> &mdash; hand-drawn and
              animated product demo video
            </li>
          </ul>
        </Section>

        <Section id="process" title="Process">
          <p className="font-red-hat-mono text-black">
            The design system was built entirely in Figma Design before any prototyping began, establishing a visual
            language that felt organic and alive. Backgrounds were created from stock images using a bitmap tool.
            Icons were created in Adobe Illustrator.
          </p>
          <p className="font-red-hat-mono mt-4 text-black">
            The product demo opening animation was hand-drawn frame by frame in Procreate, then composited in
            Illustrator and Photoshop.
          </p>
          <p className="font-red-hat-mono mt-4 text-black">
            Figma Make brought the static designs to life as an interactive, shareable prototype, making it possible
            to actually use Fig Tree, not just look at it.
          </p>
        </Section>

        <Section id="try-it" title="Try It">
          <p className="font-red-hat-mono text-black">
            Try it here:{" "}
            <a
              href="https://www.figma.com/make/Xg0OAxlVjMspf0wtB64ap1/Fig-Tree?code-node-id=0-9&p=f&t=MwXrjMQSv6nKpfFQ-0&fullscreen=1"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {"https://www.figma.com/make/Xg0OAxlVjMspf0wtB64ap1/Fig-Tree?code-node-id=0-9&p=f&t=MwXrjMQSv6nKpfFQ-0&fullscreen=1"}
            </a>
          </p>
        </Section>
      </main>
    </div>
  );
}
