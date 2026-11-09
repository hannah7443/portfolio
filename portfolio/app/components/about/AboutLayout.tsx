import type { CSSProperties, ReactNode } from "react";

// Figma "About" (file MAeeEAh3liNy9GGgvPD6eK, node 1069:1995, a 1728×1117 frame): the intro
// top-left ("Group 10", 1069:2487), a strip of photos tilted (5° here, 7° in Figma) and running behind the flower
// ("Frame 15", 1072:2912), and LET'S CONNECT bottom-right, above the "hannah shin" letters
// ("Group 31", 1071:2908). Shared by the homepage's ABOUT hover screen and /about; the parent
// supplies the letters and sizes this to the screen. Lengths are Figma px times --u, the frame
// fitted inside the screen, so the strip clears the intro and letters on wide, short screens too.
// The letters span the full width, so LET'S CONNECT keeps its distance above them in --uw,
// Figma px at the frame's 1728px width.

const FRAME = { width: 1728, height: 1117 };
const u = (n: number) => `calc(${n} * var(--u))`;
const uw = (n: number) => `calc(${n} * var(--uw))`;

/**
 * The old belt's groups, each with its caption, at the strip's 240px height (Figma's). Widths are
 * each photo's ratio from the old belt at that height.
 */
type Photo = { src: string; width: number; position?: string };
type Group = { caption: string; photos: Photo[] };
const GROUPS: Group[] = [
  // Figma crops this one to its lower part, and the chapel a little below its middle.
  { caption: "HI, NICE TO MEET YOU!", photos: [{ src: "/about-belt/1-nyc-portrait.jpg", width: 397, position: "50% 100%" }] },
  {
    caption: "DUKE STUDENT",
    photos: [
      { src: "/about-belt/2-duke-chapel.jpg", width: 190, position: "50% 71%" },
      { src: "/about-belt/2-garden-portrait.jpg", width: 180 },
    ],
  },
  {
    caption: "FIGMA CAMPUS LEADER",
    photos: [
      { src: "/about-belt/3-figma-campus-leader-card.png", width: 240 },
      { src: "/about-belt/3-figma-campus-leaders-group.png", width: 196 },
    ],
  },
  {
    caption: "COLLEGE RADIO DJ",
    photos: [
      { src: "/about-belt/4-radio-booth.jpg", width: 180 },
      { src: "/about-belt/4-wxdu-storefront.jpg", width: 320 },
    ],
  },
  { caption: "PIANIST", photos: [{ src: "/about-belt/5-pianist-hands.jpg", width: 418 }] },
];
/** As in the old belt (0.6vw, 4vw and 1vw against its 15vw photos), in Figma px. */
const PHOTO_GAP = 10;
const GROUP_GAP = 64;
const PHOTO_RADIUS = 16;
const PHOTO_HEIGHT = 240;
/** The strip's left end sits 5° below its right (Figma has 7°; Hannah raised the left end). */
const TILT_DEG = -5;
/** Copies of the groups in each half of the looping track, so one half is always wider than the strip. */
const COPIES = 3;
/**
 * The strip's centre in the frame: Figma's (Frame 15's 2276×240 rotated about its origin at −320,
 * 540) is y 520, raised 32px so the right end stays where Figma has it at the shallower tilt.
 */
const STRIP_CENTRE = { x: 824, y: 488 };

const INTRO = [
  "I’m a duke undergrad studying cs + visual media with a minor in music.",
  "i’m an experimenter at heart. drawing from computational media, music/sound, and nature, i fuel my designs with unique (and sometimes unexpected) perspectives.",
  "outside of designing, i love djing for my college radio (WXDU), playing my favorite french piano music, and making matcha for my friends.",
];
const CONNECT = [
  { label: "EMAIL", href: "mailto:hannah.shin@duke.edu" },
  { label: "LINKEDIN", href: "https://www.linkedin.com/in/hannahkshin/" },
  { label: "TWITTER", href: "https://x.com/hannahsmosaic" },
];
/** LET'S CONNECT's last line ends 241 Figma px above the frame's bottom, just over the letters. */
const CONNECT_BOTTOM = 241;

// Type never drops below these on narrow screens, where the frame's px get very small.
const body: CSSProperties = { fontSize: `max(11px, ${u(18)})`, lineHeight: "normal" };

/** The frame's coordinate space (--u, --uw) over its parent, click-through apart from any links. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 text-white"
      style={{
        ["--uw" as string]: `calc(100vw / ${FRAME.width})`,
        ["--u" as string]: `min(100vw / ${FRAME.width}, 100vh / ${FRAME.height})`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The photo strip and intro. LET'S CONNECT is AboutConnect, kept apart so the homepage can stack
 * its links above the hover screen's click-to-close layer while these stay behind the flower.
 */
export default function AboutLayout() {
  return (
    <Frame>
      <PhotoStrip />

      <section
        className="font-ibm-plex-mono absolute uppercase"
        style={{ left: u(41), top: u(48), width: `max(${u(505)}, min(22rem, calc(100% - ${u(82)})))` }}
      >
        <h1 className="font-bold normal-case" style={{ fontSize: `max(18px, ${u(32)})`, lineHeight: "normal" }}>
          HI, I’M HANNAH!
        </h1>
        <div className="space-y-[1.25em]" style={{ ...body, marginTop: u(23) }}>
          {INTRO.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </Frame>
  );
}

/** LET'S CONNECT and its links, bottom-right over the letters. */
export function AboutConnect() {
  return (
    <Frame>
      <section
        className="font-ibm-plex-mono absolute text-right uppercase"
        style={{ right: u(FRAME.width - 1670), bottom: uw(CONNECT_BOTTOM) }}
      >
        <h2 className="font-bold" style={{ fontSize: `max(13px, ${u(20)})`, lineHeight: "normal" }}>
          LET’S CONNECT!
        </h2>
        <ul style={{ ...body, marginTop: u(16) }}>
          {CONNECT.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                className="pointer-events-auto underline underline-offset-[0.2em] outline-none hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </Frame>
  );
}

/**
 * The photo groups, tilted as in the Figma and scrolling along the tilt like the old belt: the track
 * holds two identical halves back to back and the `belt-scroll` keyframes move it one half's
 * width, so the loop is seamless.
 */
function PhotoStrip() {
  return (
    <div
      aria-hidden="true"
      className="absolute overflow-hidden"
      style={{
        left: `${(STRIP_CENTRE.x / FRAME.width) * 100}%`,
        top: `${(STRIP_CENTRE.y / FRAME.height) * 100}%`,
        // Wider than the screen so the tilted ends never show.
        width: "140vw",
        transform: `translate(-50%, ${u(-PHOTO_HEIGHT / 2)}) rotate(${TILT_DEG}deg)`,
      }}
    >
      <div className="flex motion-reduce:animate-none!" style={{ width: "max-content", animation: `belt-scroll ${COPIES * 60}s linear infinite`, willChange: "transform" }}>
        {Array.from({ length: 2 * COPIES }, () => GROUPS).flat().map((group, i) => (
          <figure key={i} className="flex shrink-0 flex-col items-center" style={{ marginRight: u(GROUP_GAP) }}>
            <div className="flex" style={{ gap: u(PHOTO_GAP) }}>
              {group.photos.map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element -- decorative strip photo, not the LCP image
                <img
                  key={photo.src}
                  src={photo.src}
                  alt=""
                  className="block shrink-0 object-cover"
                  style={{
                    width: u(photo.width),
                    height: u(PHOTO_HEIGHT),
                    borderRadius: u(PHOTO_RADIUS),
                    objectPosition: photo.position,
                  }}
                />
              ))}
            </div>
            <figcaption
              className="font-ibm-plex-mono whitespace-nowrap uppercase"
              style={{ fontSize: `max(9px, ${u(16)})`, marginTop: u(13) }}
            >
              {group.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
