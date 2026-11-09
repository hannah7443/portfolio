"use client";

import Image from "next/image";
import Link from "next/link";
import GlassSectionNav, { useActiveSection } from "../../components/GlassSectionNav";
import { LazyVideo } from "../../components/LazyVideo";

// Building Radio's Future case study, styled after the fig-tree page: black
// page, the glass section nav (GlassSectionNav) on the left, and the same
// heading styles in blue instead of green. The cover is an eager <video>; every demo
// further down goes through LazyVideo so they don't all download at once.
const COVER_VIDEO = "/radio-demos/Radio-Cover.mp4";
const BULLETIN_VIDEO = "/radio-demos/Bulletin-Demo.mp4";
const VINYL_VIDEO = "/radio-demos/Vinyl-Demo.mp4";
const NOW_PLAYING_VIDEO = "/radio-demos/Now-Playing-Demo.mp4";
const DYNAMIC_BG_VIDEO = "/radio-demos/Dynamic-Bg-Demo.mp4";
const APP_V2_VIDEO = "/radio-demos/WXDU-App-v2-Demo.mp4";
const VLM_DEMO_VIDEO = "/radio-demos/VLM-Demo.mp4";
const VLM_CHART_VIDEO = "/radio-demos/VLM-Chart.mp4";
// Reflection photos: ~5MB, 5712×4284 phone shots, so they go through
// next/image to be resized for the page instead of shipping full size.
const CLOSING_IMAGE = "/radio-demos/WXDU-Closing-Image.JPG";
const DJ_HANNAH_IMAGE = "/radio-demos/DJ-Hannah.JPG";
const TOUR_IMAGE = "/radio-demos/WXDU-Tour.JPG";
const CD_ICON = "/radio-demos/icons/cd-icon.png";

const NAV_ITEMS = [
  { id: "overview", label: "OVERVIEW" },
  { id: "problem", label: "PROBLEM" },
  { id: "ux-research", label: "UX RESEARCH" },
  { id: "challenges", label: "CHALLENGES" },
  { id: "solution-overview", label: "SOLUTION\nOVERVIEW" },
  { id: "tech-stack", label: "TECH STACK" },
  { id: "highlights", label: "HIGHLIGHTS" },
  { id: "outcome", label: "OUTCOME" },
  { id: "reflection", label: "REFLECTION" },
] as const;


const INFO_COLUMNS = [
  { label: "TIMELINE", value: "Summer 2026 (10 weeks)" },
  { label: "TEAM", value: "Hannah Shin, Joseph Yan, Benjamin Ochoa, Precieux Kounieka" },
  { label: "ROLE", value: "Design Engineer" },
  { label: "SKILLS", value: "Product Design, Design Engineering, UX Research, Frontend Engineering, Backend Engineering" },
] as const;

// The fig tree page's heading styles, with blues for its greens: the section
// heading's block is #12307a (for #32431b) and subheadings #a9c4f5 (for #c4dc81).
// Whatever follows a section heading starts 16px below, overriding that
// element's own top margin.
function SectionHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h2
      className={`font-ibm-plex-mono w-fit border border-solid border-[#12307a] bg-[#12307a] px-3 text-lg [&+*]:mt-4 font-medium uppercase leading-normal tracking-[-0.04em] text-white ${className}`}
    >
      {children}
    </h2>
  );
}

const SUBHEADING = "font-ibm-plex-mono mt-10 text-xl font-normal uppercase tracking-wide text-[#a9c4f5]";

// The three products under Highlights (Website, Mobile App, Vision Language Model): the subheading
// style in a deeper blue, with whatever follows starting 12px below, overriding its own top margin.
function ProductHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`font-ibm-plex-mono text-xl font-normal uppercase tracking-wide text-[#5b8def] [&+*]:mt-3 ${className}`}>
      {children}
    </h3>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className={SUBHEADING}>{children}</h3>;
}

const QUOTES = [
  {
    text: "The retro-futuristic design aesthetic captures WXDU\u2019s unique radio culture while also being informative.",
    source: "UX Designer, Duke OIT",
  },
  { text: "The background design makes me want to listen to WXDU forever.", source: "WXDU community member" },
  { text: "It\u2019s super easy for people to tune into my show using the new website and app.", source: "WXDU DJ" },
] as const;

export default function RadioPage() {
  const activeId = useActiveSection(NAV_ITEMS.map((item) => item.id));

  return (
    <div data-page="radio" className="relative min-h-screen overflow-hidden bg-black text-[#0b1f4d]">
      <Link
        href="/"
        className="font-ibm-plex-mono fixed left-8 top-8 z-30 flex items-center gap-2 text-sm text-[#3b6bd6] hover:underline"
      >
        <span aria-hidden="true">&larr;</span>
        back to projects
      </Link>

      <div className="relative z-10 px-10 pb-32 pt-8 md:px-16">
        {/* As on the fig tree page: Redaction 50 Italic in white, with the CD icon to its left. Sized in
            em so it scales down with the title on narrower screens. */}
        <h1 className="font-redaction-50 flex items-center gap-[0.48em] text-[clamp(2rem,3.4vw,4rem)] font-normal italic leading-none text-white md:pl-64">
          <img src={CD_ICON} alt="" aria-hidden="true" className="h-[1.4em] w-[1.4em] shrink-0 object-contain" />
          Building Radio&rsquo;s Future
        </h1>

        <div className="mt-4">
          {/* Directory: the glass nav, fixed to the viewport so it stays visible however far the
              content beside it is scrolled. */}
          <GlassSectionNav items={NAV_ITEMS} activeId={activeId} />

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
                    <p className="font-ibm-plex-mono text-xs font-bold uppercase tracking-widest text-[#3b6bd6]">{col.label}</p>
                    <p className="font-sans tracking-wide mt-1 text-base text-[#8A8E90]">{col.value}</p>
                  </div>
                ))}
              </div>

              <SubHeading>Duke&rsquo;s Office of Information Technology Internship</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Building Radio&rsquo;s Future was project part of a 10-week, full-stack internship at Duke&rsquo;s Office of Information Technology (OIT) Department. Teams of Duke undergraduates were given real-world projects that address challenges at Duke, in Durham, and beyond, and built products from concept to completion.
              </p>
              <SubHeading>What is Non-Commercial Radio?</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Non-commercial radio stations are community-centered, volunteer-run radio stations. They focus on localized, human-curated music discovery in the age of mass-consumption and algorithmic media. These stations are crucial hubs to uplifting independent musicians and music scenes, promote local events and organizations, and build community centered on a shared love of music. WXDU and WXYC are two local non-commercial radio stations at and near Duke University.
              </p>
              <SubHeading>Stakeholders</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Our stakeholders for this project, Building Radio&rsquo;s Future, were software engineers at the following stations:
              </p>
              <ol className="font-sans tracking-wide mt-4 w-full list-decimal space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>WXDU is Duke and Durham&rsquo;s alternative, non-commercial radio station. It is run by 50% undergraduate Duke students and 50% local community members.</li>
                <li>WXYC is UNC Chapel Hill&rsquo;s student-run, freeform radio station. It is run primarily by undergraduates.</li>
              </ol>
            </section>

            <section id="problem" className="scroll-mt-28 pt-24">
              <SectionHeading>Problem</SectionHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Radio software stacks are often custom-built by volunteers, fragile, and patchy, leading to a lack of maintainability/code accessibility and a hard-to-navigate streaming experience.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Working with local non-commercial college radio stations WXDU (Duke and Durham&rsquo;s station) and WXYC (UNC Chapel Hill&rsquo;s station), our task was to create open-source, maintainable, and accessible solutions to the often scrappy, outdated technology that non-commercial radio stations rely on every day.
              </p>
            </section>

            <section id="ux-research" className="scroll-mt-28 pt-24">
              <SectionHeading>UX Research</SectionHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                We conducted 13 semi-structured interviews with DJs at WXDU to understand radio culture, technology, community, and issues to focus on. Conducting thematic analysis, we uncovered several common themes that informed our solutions:
              </p>
              <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>Institutional instability: constant rotation of students in and out of station</li>
                <li>Integral nature of music discovery to the station</li>
                <li>DIY/Volunteer culture</li>
                <li>Importance of WXDU&rsquo;s material &amp; archival history</li>
                <li>Physical artifacts: CDs, show posters</li>
              </ul>
            </section>

            <section id="challenges" className="scroll-mt-28 pt-24">
              <SectionHeading>Challenges</SectionHeading>
              <SubHeading>Increase <span className="font-bold">visibility of current-playing</span>{" "}information &amp; ease of web-streaming WXDU</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                WXDU&rsquo;s website has not been updated since 2008, and UX interviews revealed that the location and function of streaming the radio on it was poor and difficult to navigate. The radio stream needed to be centralized in the new design.
              </p>
              <SubHeading>Overhaul visual style while keeping functionality familiar to users</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                WXDU&rsquo;s culture is shaped by an intergenerational connection between undergraduate students and community members &mdash; bridging the gap between Duke and Durham. It was extremely important to build a new design identity for the site that was accessible and easy to navigate for all users.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                UX interviews revealed that WXDU&rsquo;s 2008 website was difficult to navigate.
              </p>
              <SubHeading>Improve real-time communication between DJs and listeners and encourage music exploration</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                The existing method of communication between listeners and DJs was for listeners to call the station number while a DJ was on air. This was outdated technology that DJs had to juggle with while queueing songs on air.
              </p>
            </section>

            <section id="solution-overview" className="scroll-mt-28 pt-24">
              <SectionHeading>Solution Overview</SectionHeading>
              <ol className="font-sans tracking-wide mt-4 w-full list-decimal space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>New Website for WXDU</li>
                <li>WXDU Mobile Listening App</li>
                <li>Vision Language Model for Album Alt Text</li>
              </ol>
            </section>

            <section id="tech-stack" className="scroll-mt-28 pt-24">
              <SectionHeading>Tech Stack</SectionHeading>
              {/* One column per product; stacked on small screens. */}
              <div className="grid gap-8 md:grid-cols-3">
                <div>
                  <p className="font-sans tracking-wide text-base font-bold text-[#8A8E90]">Website:</p>
                  <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                    <li>Backend: Node.js, Express.js</li>
                    <li>Frontend: TailwindCSS, Next.js, TinaCMS</li>
                    <li>Database: MySQL, MongoDB</li>
                    <li>Other/Infra: Icecast</li>
                  </ul>
                </div>
                <div>
                  <p className="font-sans tracking-wide text-base font-bold text-[#8A8E90]">Mobile Development:</p>
                  <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                    <li>Backend: Express.js</li>
                    <li>Frontend: TypeScript, NativeWind, React Native, Expo</li>
                    <li>Database: MySQL, MongoDB</li>
                  </ul>
                </div>
                <div>
                  <p className="font-sans tracking-wide text-base font-bold text-[#8A8E90]">Vision Language Model:</p>
                  <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                    <li>AI/ML Model: Qwen3-VL</li>
                    <li>AI/ML Runtime &amp; Inference: Ollama, mlx-vlm</li>
                    <li>Backend: Express.js</li>
                    <li>Networking/Infra: Tailscale</li>
                    <li>Database: PostgresSQL, Express.js</li>
                  </ul>
                </div>
              </div>
            </section>

            <section id="highlights" className="scroll-mt-28 pt-24">
              <SectionHeading>Highlights</SectionHeading>
              <ProductHeading>Website</ProductHeading>
              <SubHeading>Vinyl Player Widget: View Song on Air</SubHeading>
              <LazyVideo src={VINYL_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Users on the homepage can easily see details about what song is on air and stream it. The widget updates dynamically as the DJ on air updates the song being played.
              </p>
              <SubHeading>Now Playing Widget: View DJ on Air</SubHeading>
              <LazyVideo src={NOW_PLAYING_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Featured on the homepage dashboard, viewers can immediately see more information about the who the DJ on air is and what the name of their show is via this widget.
              </p>
              <SubHeading>Custom WebGL Dynamic Background Shader</SubHeading>
              <LazyVideo src={DYNAMIC_BG_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Behind the homepage sits a slowly shifting background that gives the site the warm, analog feel of a live radio station. The background is a custom GLSL fragment shader rendered with WebGL, with every pixel calculated on the GPU rather than the CPU. It uses texture-based noise, caps rendering at 30fps and 1x pixel density, and requests the device&rsquo;s low-power GPU. These reduce battery drain and heat without a visible drop in quality.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Before it loads, the site checks whether the device supports real hardware acceleration. If it doesn&rsquo;t, the site shows a static background instead of silently running the shader on the CPU and slowing the page down. Users with reduced-motion settings get the same static background, so the site stays accessible and consistent.
              </p>
              <SubHeading>Customizable Bulletin Board Showcasing WXDU&rsquo;s Vibrant History</SubHeading>
              <LazyVideo src={BULLETIN_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                This customizable bulletin board of images is featured on the website&rsquo;s homepage, and showcases WXDU&rsquo;s past music show posters and station archives. Based on the UX interviews, it was imperative to highlight the rich history behind the station.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                This feature is also customizable through the integration of TinaCMS: a headless, Git-backed content system. Users can log into the admin version of the website using this system and edit the pictures being shown without touching code. This enables non-technical users, such as DJs and community members, to edit the pictures to include upcoming show posters and event graphics on the bulletin board without navigating through a codebase.
              </p>

              <ProductHeading className="mt-16">Mobile App: Redesign in Progress</ProductHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                WXDU had no mobile listening experience; streaming lived only on the website. By the end of the internship, our team shipped a v1 app for streaming, viewing recently played songs, and sending song requests, then ran two UX workshops with DJs to test it.
              </p>
              <SubHeading>What We Learned</SubHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Listeners liked v1&rsquo;s simplicity, and the dynamic background reminded one user of an old FM dial and made them want to tune in. But the workshops surfaced a bigger question: <em>what is the app for, if not to replicate the website?</em> Four themes came out of the feedback:
              </p>
              <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>
                  <span className="font-bold">Listeners want to keep what they hear.</span>{" "}Recently played songs disappeared too quickly, and users wanted to tap through to the full on-air playlist and save songs for later.
                </li>
                <li>
                  <span className="font-bold">Staying in the loop matters.</span>{" "}Users wanted to see what&rsquo;s on today without leaving the main screen.
                </li>
                <li>
                  <span className="font-bold">DJs want an archive of their own shows.</span>{" "}DJs asked to revisit their past playlists, star songs while listening, and see stats about what they&rsquo;ve played. They also wanted control over their visibility, such as making profiles public or private and turning off listener messages.
                </li>
                <li>
                  <span className="font-bold">Radio is an accessibility medium.</span>{" "}Radio has long served blind and low-vision listeners, so the app has to work fully with screen readers and keyboard navigation, not just look clean.
                </li>
              </ul>
              <SubHeading>Redesign Direction</SubHeading>
              {/* Text on the left, the app demo on the right (a little the wider of the two); stacked on small screens. */}
              <div className="mt-4 grid items-center gap-8 md:grid-cols-[4fr_5fr]">
                <div>
                  <p className="font-sans tracking-wide w-full text-base leading-relaxed text-[#8A8E90]">
                    I&rsquo;m redesigning the app around four focused pages, each answering one of these themes:
                  </p>
                  <ol className="font-sans tracking-wide mt-4 w-full list-decimal space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                    <li>
                      <span className="font-bold">Recently Played:</span>{" "}the live playlist, with a toggle-style album cover of recently played songs
                    </li>
                    <li>
                      <span className="font-bold">Library:</span>{" "}saved songs that listeners and DJs can export to Spotify, Apple Music, and other platforms, and that DJs can save to their profiles on the station database to use in their own shows.
                    </li>
                    <li>
                      <span className="font-bold">Schedule:</span>{" "}upcoming shows, with notifications and reminders.
                    </li>
                    <li>
                      <span className="font-bold">DJ Profile:</span>{" "}for logged-in DJs, every song played across their past shows.
                    </li>
                  </ol>
                  <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                    Accessibility is a baseline requirement across all four pages, not a separate feature.
                  </p>
                  <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90] italic">The redesign is targeted for release in Spring 2027.</p>
                </div>
                {/* 1424×1500 out of the clip's 1424×1566 with the frame pinned to the bottom, so a
                    sliver of the top is cropped off. */}
                <LazyVideo
                  src={APP_V2_VIDEO}
                  className="aspect-[1424/1500] w-full rounded-[2.5rem] object-cover object-bottom"
                />
              </div>

              <ProductHeading className="mt-16">Vision Language Model: Album Art Alt Text</ProductHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                Album covers are central to music discovery but are almost never described for blind and low-vision listeners. We built an open-source pipeline to generate album-cover alt text that meets WCAG 2.2 standards.
              </p>
              <LazyVideo src={VLM_DEMO_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                A large model (Qwen3-VL-32B) drafted alt text for 1,796 covers using our style guide: objective, focused on the main subject, and under 130 characters, the point where screen readers cut off. My role was human review and testing. I accepted, rejected, or corrected drafts cover by cover, catching patterns like overlong descriptions, subjective language, and stock phrases such as &ldquo;Album cover of&hellip;&rdquo;.
              </p>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                That reviewed set trained a smaller model (Qwen3-VL-8B) light enough to run on the station&rsquo;s own hardware. Across seven fine-tuning trials, the best version produced well-structured output 99% of the time and stayed within the character limit 91% of the time on covers it had never seen. Before fine-tuning, it met neither standard on any image.
              </p>
              <LazyVideo src={VLM_CHART_VIDEO} className="mt-4 w-full rounded-[2.5rem] object-cover" />
            </section>

            <section id="outcome" className="scroll-mt-28 pt-24">
              <SectionHeading>Outcome</SectionHeading>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                The new WXDU website is live at{" "}
                <a href="https://wxdu.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                  wxdu.org
                </a>{" "}
                and used daily by DJs and community members to stream the station, discover new music, and see upcoming shows.
              </p>
              <ul className="font-sans tracking-wide mt-4 w-full list-disc space-y-2 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>Deployed website at wxdu.org</li>
                <li>Open-source vision language model for album alt text</li>
                <li>Open-source GitHub repository for Computing @ WXDU</li>
                <li>Mobile app releasing Spring 2027</li>
              </ul>
              <p className="font-sans tracking-wide mt-4 w-full text-base leading-relaxed text-[#8A8E90]">
                We presented the project on July 24, 2026, to OIT staff, faculty, DJs, and members of the radio community.
              </p>
              {QUOTES.map((quote) => (
                <figure key={quote.source}>
                  <blockquote className={SUBHEADING}>&ldquo;{quote.text}&rdquo;</blockquote>
                  <figcaption className="font-sans tracking-wide mt-2 text-base text-[#8A8E90]">&mdash; {quote.source}</figcaption>
                </figure>
              ))}
              <p className="font-sans tracking-wide mt-10 w-full text-base leading-relaxed text-[#8A8E90]">
                After the internship, I joined WXDU&rsquo;s Computing Team, where I continue designing and building app features and internal tools for DJ software.
              </p>
            </section>

            <section id="reflection" className="scroll-mt-28 pt-24">
              <SectionHeading>Reflection</SectionHeading>
              {/* Landscape, portrait, landscape side by side; the 16:9:16 column split gives all three the same height. */}
              <div className="grid grid-cols-[16fr_9fr_16fr] gap-3">
                <Image
                  src={CLOSING_IMAGE}
                  alt="WXDU&rsquo;s glass-fronted studio, its window painted with a red X, &ldquo;wxdu 88.7 fm,&rdquo; a skeleton and a jack-o&rsquo;-lantern"
                  width={5712}
                  height={4284}
                  sizes="(min-width: 768px) 30vw, 40vw"
                  className="h-auto w-full rounded-2xl"
                />
                <Image
                  src={DJ_HANNAH_IMAGE}
                  alt="Hannah putting on headphones at the WXDU mixing board during a DJ shift while another DJ watches"
                  width={4284}
                  height={5712}
                  sizes="(min-width: 768px) 17vw, 22vw"
                  className="h-auto w-full rounded-2xl"
                />
                <Image
                  src={TOUR_IMAGE}
                  alt="Hannah and three others gathered around a mixing board and microphones on a radio studio tour"
                  width={5712}
                  height={4284}
                  sizes="(min-width: 768px) 30vw, 40vw"
                  className="h-auto w-full rounded-2xl"
                />
              </div>

              <ol className="font-sans tracking-wide mt-8 w-full list-decimal space-y-6 pl-5 text-base leading-relaxed text-[#8A8E90]">
                <li>
                  <p className="font-bold">Working at the intersection of design and code</p>
                  <p className="mt-2">
                    As the design engineer on this project, I got to carry WXDU&rsquo;s new design identity from first sketches all the way to production. Along the way, I learned to work within the station&rsquo;s existing databases and backend, and I found that knowing those constraints made me a better designer. For example, the homepage shader had to feel warm and analog while still running smoothly on older devices, so I designed it with performance limits and a static fallback built in from the start. Being able to build what I designed led to feasible solutions and effective communication with the other station engineers.
                  </p>
                </li>
                <li>
                  <p className="font-bold">Designing for a community with deep roots</p>
                  <p className="mt-2">
                    Through UX interviews, getting involved at the station, and learning to DJ myself (see my{" "}
                    <Link href="/about" className="underline hover:text-white">
                      about page
                    </Link>
                    ), I came to understand how much WXDU&rsquo;s history means to the people who keep it running. Many DJs have been part of the station for over 20 years. The challenge was creating something modern and accessible without erasing the culture that makes WXDU what it is. These were major considerations that I factored into creating the design identity for this project.
                  </p>
                </li>
              </ol>
            </section>

          </main>
        </div>
      </div>
    </div>
  );
}
