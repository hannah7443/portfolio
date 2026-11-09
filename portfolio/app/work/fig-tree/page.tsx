"use client";

import Link from "next/link";
import { LazyVideo } from "../../components/LazyVideo";
import GlassSectionNav, { useActiveSection } from "../../components/GlassSectionNav";

// Figma "Main Tree" (node 2011:127): a dark case-study page with a
// scroll-spy directory on the left (GlassSectionNav) that marks whichever
// heading is currently active, and a hero cover video under
// "Overview". Content for each section below the hero is filled in
// separately.
// COVER_VIDEO stays a plain eager <video> — it's the hero, visible the
// instant the page loads, and small (~1.4MB). Every other demo clip below
// is 25-244MB and sits further down the scroll, so those go through
// LazyVideo instead — rendering all of them as normal autoplay <video>
// tags meant every one of these started downloading simultaneously on
// page load regardless of scroll position, which is what was making the
// page (and whichever clip you actually scrolled to) feel stuck buffering.
const COVER_VIDEO = "/fig-tree-demos/Animated-Fig-Cover.mp4";
const ORCHARD_VIDEO = "/fig-tree-demos/Orchard-Demo.mp4";
const CREATE_FIGMENT_VIDEO = "/fig-tree-demos/Create-Figment.mp4";
const FIGMENT_STATE_VIDEO = "/fig-tree-demos/Figment-State-Final.mp4";
const SUB_BRANCH_VIDEO = "/fig-tree-demos/Sub-branch-demo.mp4";
const PHILOSOPHICAL_VIDEO = "/fig-tree-demos/philosophical_video.MOV";
const BLURRED_BRANCH = "/fig-tree-demos/icons/blurred-fig-branch.png";
const FIG_ICON = "/fig-tree-demos/icons/fig-cross-section.png";

const NAV_ITEMS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "problem", label: "PROBLEM" },
  { id: "concept", label: "CONCEPT" },
  { id: "challenges", label: "CHALLENGES" },
  { id: "design-highlights", label: "DESIGN\nHIGHLIGHTS" },
  { id: "reflection", label: "REFLECTION" },
] as const;

const INFO_COLUMNS = [
  { label: "TIMELINE", value: "June 2026" },
  { label: "TEAM", value: "Hannah Shin" },
  { label: "ROLE", value: "Product Designer" },
  { label: "SKILLS", value: "Product Design, Design Systems" },
] as const;

// Figma 1053:1730 ("CONCEPT"): IBM Plex Mono Medium in white on a #32431b
// block that hugs the text, scaled down from Figma's 28.929px to 18px with
// roomier side padding. Whatever follows it starts 16px below, overriding
// that element's own top margin.
function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-ibm-plex-mono w-fit border border-solid border-[#32431b] bg-[#32431b] px-3 text-lg [&+*]:mt-4 font-medium uppercase leading-normal tracking-[-0.04em] text-white ${className}`}
    >
      {children}
    </h2>
  );
}

// Colour from Figma 1053:1780 ("Productivity Redefined…").
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-ibm-plex-mono mt-10 text-xl font-normal uppercase tracking-wide text-[#c4dc81]">{children}</h3>
  );
}

export default function FigTreePage() {
  const activeId = useActiveSection(NAV_ITEMS.map((item) => item.id));


  return (
    <div data-page="fig-tree" className="relative min-h-screen overflow-hidden bg-black text-[#1f3d12]">
      {/* Decorative blurred branches. The directory sidebar's wrapper now
          stretches to the full content height so its sticky child stays
          pinned near the top of the viewport for the entire scroll range,
          so a left branch anywhere near the top would sit behind/under it —
          instead it's pinned to the very bottom of the page, well past
          where the sidebar could ever be, so it's always fully visible. */}
      <img
        src={BLURRED_BRANCH}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-40 w-[38vw] max-w-[620px] rotate-[80deg] opacity-70"
      />
      <img
        src={BLURRED_BRANCH}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 bottom-0 w-[32vw] max-w-[520px] -rotate-[100deg] opacity-60"
      />

      <Link
        href="/"
        className="font-ibm-plex-mono fixed left-8 top-8 z-30 flex items-center gap-2 text-sm text-[#2f5d1e] hover:underline"
      >
        <span aria-hidden="true">&larr;</span>
        back to projects
      </Link>

      <div className="relative z-10 px-10 pb-32 pt-8 md:px-16">
        {/* Figma 1053:1729 + 1053:1781: 64px in white, with the fig cross-section
            icon (90×112) to its left; set in Redaction 50 Italic rather than the
            Figma's Geist. Sized in em so it scales down with the title on
            narrower screens. */}
        <h1 className="font-redaction-50 flex items-center gap-[0.48em] text-[clamp(2rem,3.4vw,4rem)] font-normal italic leading-none text-white md:pl-64">
          <img src={FIG_ICON} alt="" aria-hidden="true" className="h-[1.75em] w-[1.4em] shrink-0 object-cover" />
          Fig Tree Notes App
        </h1>

        <div className="mt-4">
          {/* Directory: the glass nav from Figma, fixed to the viewport so it
              stays visible however far the content beside it is scrolled. */}
          <GlassSectionNav items={NAV_ITEMS} activeId={activeId} />

          {/* Content */}
          <main className="min-w-0 md:pl-64">
            <section id="overview" className="scroll-mt-28">
              <video
                src={COVER_VIDEO}
                className="w-full rounded-[2.5rem] object-cover"
                autoPlay
                muted
                loop
                playsInline
              />

              <SectionHeading className="mt-8">Overview</SectionHeading>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {INFO_COLUMNS.map((col) => (
                  <div key={col.label}>
                    <p className="font-ibm-plex-mono text-xs font-bold uppercase tracking-widest text-[#5b9a3c]">{col.label}</p>
                    <p className="font-sans tracking-wide mt-1 text-base text-[#8A8E90]">{col.value}</p>
                  </div>
                ))}
              </div>

              <p className="font-sans tracking-wide mt-8 w-full text-base leading-relaxed text-[#8A8E90]">
                Fig Tree was created for Figma x Contra&rsquo;s two-week Makeathon in 2026. Try it{" "}
                <a
                  href="https://www.figma.com/make/Xg0OAxlVjMspf0wtB64ap1/Fig-Tree?code-node-id=0-9&p=f&t=MwXrjMQSv6nKpfFQ-0&fullscreen=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#2f5d1e]"
                >
                  here
                </a>
                .
              </p>
            </section>

            <section id="problem" className="scroll-mt-28 pt-24">
              <SectionHeading>Problem</SectionHeading>

              <p className="font-sans tracking-wide mt-6 w-full text-xl italic leading-relaxed text-[#8A8E90]">
                &ldquo;I saw my life branching out before me like the green fig tree&hellip;I wanted each and every
                one of them, but choosing one meant losing all the rest.&rdquo; &mdash; Sylvia Plath, <em>The Bell
                Jar</em>
              </p>

              <LazyVideo src={PHILOSOPHICAL_VIDEO} className="mt-6 w-full rounded-[2.5rem] object-cover" />

              <p className="font-sans tracking-wide mt-6 w-full text-base leading-relaxed text-[#8A8E90]">
                As a young adult, Sylvia Plath&rsquo;s fig tree dilemma often emerges: when choosing a path &mdash; a
                major, career, passion &mdash; the other possibilities and ideas seem to wither away.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                But the branches of life we don&rsquo;t pursue don&rsquo;t actually disappear. They simply have
                nowhere to grow.
              </p>
            </section>

            <section id="concept" className="scroll-mt-28 pt-24">
              <SectionHeading>Concept</SectionHeading>

              <SubHeading>Productivity Redefined: Let Your Ideas Ripen</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Fig Tree is a platform where no idea has to die for another to live. Inspired by Sylvia Plath&rsquo;s
                Fig Tree analogy, users grow ideas as &ldquo;figments&rdquo; across three states: unripe, ripening,
                and ripe.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Productivity tools today often assist with project execution rather than exploration. Figment states
                encourage you to think through every idea in progress and allows them come to fruition. Every idea
                has a home on your fig tree, no matter how formed or unformed it is.
              </p>

              <SubHeading>Grow Each Branch of Your Life</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Organize your ideas from big to small. All large ideas exist under your Orchard of Ideas. Once you
                have an idea, plant a new fig tree in the orchard and plant as many figments as you would like.
                Within each fig tree, you can also grow a sub-branch of figments for more granular ideas.
              </p>
            </section>

            <section id="challenges" className="scroll-mt-28 pt-24">
              <SectionHeading>Challenges</SectionHeading>

              <SubHeading>Make Idea Generation Low-Stakes</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                When an idea is not fully formed, we often feel like it is not worth writing down. Fig Tree needed
                to limit the amount of barriers between an idea in one&rsquo;s head and the act of beginning to
                develop it.
              </p>

              <SubHeading>Track &ldquo;In-Between&rdquo; Idea States</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                There&rsquo;s often more nuance to an idea than &ldquo;unfinished&rdquo; versus &ldquo;finished&rdquo;.
                There needed to be a way to track ideas that were a work in progress, encouraging users to embrace
                the developmental stage of a concept.
              </p>

              <SubHeading>Organize Complex Threads of Ideas</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Work-in-progress ideas can get chaotic. Fig Tree needed to organize them simply while accommodating
                complex ideas.
              </p>
            </section>

            <section id="design-highlights" className="scroll-mt-28 pt-24">
              <SectionHeading>Design Highlights</SectionHeading>

              <SubHeading>Orchard</SubHeading>
              <LazyVideo src={ORCHARD_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Each user has an Orchard of Ideas with unlimited space to create new trees, where they can begin
                growing figments. Trees can (and should!) range across all different topics: majors, art ideas,
                music, recipes to cook&hellip;
              </p>

              <SubHeading>Seamlessly Begin Growing A Figment</SubHeading>
              <LazyVideo src={CREATE_FIGMENT_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Within each tree, users can easily begin growing new figments. Figments can be as detailed or
                low-commitment as a user prefers: they can easily jot down notes or add pictures, and set the state
                of the idea to unripe, ripening, or ripe.
              </p>

              <SubHeading>Figment states + Tracker</SubHeading>
              <LazyVideo src={FIGMENT_STATE_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                An unripe figment represents a newly formed idea. A ripening figment represents an idea in progress.
                A ripe figment represents an idea ready for action. Users can simply click on a figment and change
                its state if progress level on an idea changes. A tracking bar at the bottom of each tree that
                counts the number of figments in each state.
              </p>

              <SubHeading>Grow a Sub-branch in an Existing Figment</SubHeading>
              <LazyVideo src={SUB_BRANCH_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Fig Tree accommodates big and small ideas. A figment that needs more organization can utilize the
                sub-branch feature, which allows a user to grow another set of figments within an existing one.
              </p>
            </section>

            <section id="reflection" className="scroll-mt-28 pt-24">
              <SectionHeading>Reflection: What I Learned</SectionHeading>

              <ol className="font-sans tracking-wide mt-6 w-full list-decimal space-y-4 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>
                  <span className="font-bold">Importance of design systems:</span> Creating a system to organize
                  complex ideas was a major challenge in this project. It forced me to think about design on a
                  broader scale and how each feature would contribute to the large picture of laying out the
                  contents of one&rsquo;s mind.
                </li>
                <li>
                  <span className="font-bold">Philosophical Backbone:</span> Having a strong purpose for a product
                  is extremely important. The fig tree metaphor is a main differentiator of this productivity app
                  than anything else, and I felt compelled to stick to its philosophy once I established that as
                  the backbone.
                </li>
              </ol>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
