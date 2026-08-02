"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

type Corner = "tl" | "tr" | "bl" | "br";

type Artwork = {
  id: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
  corners: [Corner, Corner];
  orbitDuration: number;
  orbitDirection: 1 | -1;
};

const CANVAS_W = 1280;
const CANVAS_H = 832;

const ARTWORKS: Artwork[] = [
  {
    id: "Coffee-Cup",
    src: "/artwork/Coffee-Cup.MOV",
    left: 103,
    top: 58,
    width: 216,
    height: 190,
    corners: ["tr", "br"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Weird-Fishes",
    src: "/artwork/Weird-Fishes.mov",
    left: 469,
    top: 58,
    width: 339,
    height: 190,
    corners: ["bl", "br"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "September-Rain",
    src: "/artwork/September-Rain.MP4",
    left: 866,
    top: 118,
    width: 400,
    height: 225,
    corners: ["tl", "bl"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Cowboys-Angels",
    src: "/artwork/Cowboys-Angels.mov",
    left: 43,
    top: 270,
    width: 334,
    height: 252,
    corners: ["tr", "br"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Rilkean-Heart",
    src: "/artwork/Rilkean-Heart.mov",
    left: 620,
    top: 558,
    width: 330,
    height: 246,
    corners: ["tl", "tr"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Mary-Oliver",
    src: "/artwork/Mary-Oliver.MOV",
    left: 952,
    top: 420,
    width: 287,
    height: 214,
    corners: ["tl", "bl"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Memories",
    src: "/artwork/Memories.mov",
    left: 86,
    top: 584,
    width: 187,
    height: 194,
    corners: ["tl", "tr"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
  {
    id: "Shadow-Puppets",
    src: "/artwork/Shadow-Puppets.MP4",
    left: 300,
    top: 630,
    width: 264,
    height: 148,
    corners: ["tl", "tr"],
    orbitDuration: 60,
    orbitDirection: 1,
  },
];

const TEXT_BOX = { left: 470, top: 287, width: 340, height: 220 };
const TEXT_CENTER = {
  x: TEXT_BOX.left + TEXT_BOX.width / 2,
  y: TEXT_BOX.top + TEXT_BOX.height / 2,
};

const BLACK_BOX_PADDING = 8;
const BLACK_BOX = {
  left: TEXT_BOX.left - BLACK_BOX_PADDING,
  top: TEXT_BOX.top - BLACK_BOX_PADDING,
  width: TEXT_BOX.width + BLACK_BOX_PADDING * 2,
  height: TEXT_BOX.height + BLACK_BOX_PADDING * 2,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Finds where a ray from the box's center toward (dx, dy) crosses the box's edge,
// picking the left/right edge whenever the direction leans more horizontal than
// vertical (and vice versa) so the point always reaches the box's full width/height.
function boxEdgePoint(dx: number, dy: number) {
  const halfW = BLACK_BOX.width / 2;
  const halfH = BLACK_BOX.height / 2;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const x = TEXT_CENTER.x + Math.sign(dx) * halfW;
    const y = clamp(TEXT_CENTER.y + dy * (halfW / Math.abs(dx)), TEXT_CENTER.y - halfH, TEXT_CENTER.y + halfH);
    return { x, y };
  }
  const y = TEXT_CENTER.y + Math.sign(dy) * halfH;
  const x = clamp(TEXT_CENTER.x + dx * (halfH / Math.abs(dy)), TEXT_CENTER.x - halfW, TEXT_CENTER.x + halfW);
  return { x, y };
}

const CLEARANCE = 6;

type Center = { cx: number; cy: number; width: number; height: number };

const TEXT_OBSTACLE: Center = {
  cx: TEXT_CENTER.x,
  cy: TEXT_CENTER.y,
  width: BLACK_BOX.width,
  height: BLACK_BOX.height,
};

// Pushes `box` fully away from the fixed text obstacle along whichever axis
// needs the smaller shove, so it never overlaps the text.
function pushOutOfText(box: Center) {
  const overlapX = (box.width + TEXT_OBSTACLE.width) / 2 + CLEARANCE - Math.abs(box.cx - TEXT_OBSTACLE.cx);
  const overlapY = (box.height + TEXT_OBSTACLE.height) / 2 + CLEARANCE - Math.abs(box.cy - TEXT_OBSTACLE.cy);
  if (overlapX <= 0 || overlapY <= 0) return;

  if (overlapX < overlapY) {
    box.cx += overlapX * (box.cx >= TEXT_OBSTACLE.cx ? 1 : -1);
  } else {
    box.cy += overlapY * (box.cy >= TEXT_OBSTACLE.cy ? 1 : -1);
  }
}

// Separates two overlapping artwork boxes by nudging each away (half each)
// along whichever axis needs the smaller shove.
function separate(a: Center, b: Center) {
  const overlapX = (a.width + b.width) / 2 + CLEARANCE - Math.abs(a.cx - b.cx);
  const overlapY = (a.height + b.height) / 2 + CLEARANCE - Math.abs(a.cy - b.cy);
  if (overlapX <= 0 || overlapY <= 0) return;

  if (overlapX < overlapY) {
    const push = (overlapX / 2) * (a.cx <= b.cx ? -1 : 1);
    a.cx += push;
    b.cx -= push;
  } else {
    const push = (overlapY / 2) * (a.cy <= b.cy ? -1 : 1);
    a.cy += push;
    b.cy -= push;
  }
}

const ORBITS = ARTWORKS.map((artwork) => {
  const cx0 = artwork.left + artwork.width / 2;
  const cy0 = artwork.top + artwork.height / 2;
  const dx = cx0 - TEXT_CENTER.x;
  const dy = cy0 - TEXT_CENTER.y;
  return {
    radius: Math.hypot(dx, dy),
    angle0: Math.atan2(dy, dx),
  };
});

function pct(value: number, total: number) {
  return `${(value / total) * 100}%`;
}

const CORNER_STYLE: Record<Corner, React.CSSProperties> = {
  tl: { left: 0, top: 0 },
  tr: { left: "100%", top: 0 },
  bl: { left: 0, top: "100%" },
  br: { left: "100%", top: "100%" },
};

export default function PlaygroundBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const markerRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const lineRefs = useRef<Record<string, SVGLineElement | null>>({});

  useEffect(() => {
    let frame: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const container = containerRef.current;
      if (!container) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const elapsedSeconds = (now - startTime) / 1000;

      const hubs: Record<string, { x: number; y: number }> = {};

      const centers: Record<string, Center> = {};
      ARTWORKS.forEach((artwork, i) => {
        const { radius, angle0 } = ORBITS[i];
        const angle =
          angle0 +
          artwork.orbitDirection * (elapsedSeconds / artwork.orbitDuration) * 2 * Math.PI;
        centers[artwork.id] = {
          cx: TEXT_CENTER.x + radius * Math.cos(angle),
          cy: TEXT_CENTER.y + radius * Math.sin(angle),
          width: artwork.width,
          height: artwork.height,
        };
      });

      for (let pass = 0; pass < 4; pass++) {
        for (const artwork of ARTWORKS) {
          pushOutOfText(centers[artwork.id]);
        }
        for (let i = 0; i < ARTWORKS.length; i++) {
          for (let j = i + 1; j < ARTWORKS.length; j++) {
            separate(centers[ARTWORKS[i].id], centers[ARTWORKS[j].id]);
          }
        }
      }

      ARTWORKS.forEach((artwork) => {
        const box = boxRefs.current[artwork.id];
        if (!box) return;
        const { cx, cy } = centers[artwork.id];
        box.style.left = pct(cx - artwork.width / 2, CANVAS_W);
        box.style.top = pct(cy - artwork.height / 2, CANVAS_H);
        hubs[artwork.id] = boxEdgePoint(cx - TEXT_CENTER.x, cy - TEXT_CENTER.y);
      });

      const rect = container.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;

      for (const artwork of ARTWORKS) {
        const hub = hubs[artwork.id];
        if (!hub) continue;
        artwork.corners.forEach((corner, i) => {
          const marker = markerRefs.current[`${artwork.id}-${corner}`];
          const line = lineRefs.current[`${artwork.id}-corner-${i}`];
          if (!marker || !line) return;
          const mRect = marker.getBoundingClientRect();
          const x = (mRect.left - rect.left) * scaleX;
          const y = (mRect.top - rect.top) * scaleY;
          line.setAttribute("x1", String(hub.x));
          line.setAttribute("y1", String(hub.y));
          line.setAttribute("x2", String(x));
          line.setAttribute("y2", String(y));
        });
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black pt-24">
      <div
        ref={containerRef}
        className="relative w-full max-w-[1280px]"
        style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
      >
        <div
          className="absolute bg-black"
          style={{
            left: pct(BLACK_BOX.left, CANVAS_W),
            top: pct(BLACK_BOX.top, CANVAS_H),
            width: pct(BLACK_BOX.width, CANVAS_W),
            height: pct(BLACK_BOX.height, CANVAS_H),
          }}
        />

        <svg
          className="pointer-events-none absolute inset-0 z-10 h-full w-full"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="none"
        >
          {ARTWORKS.flatMap((artwork) =>
            artwork.corners.map((_, i) => (
              <line
                key={`${artwork.id}-corner-${i}`}
                ref={(el) => {
                  lineRefs.current[`${artwork.id}-corner-${i}`] = el;
                }}
                stroke="white"
                strokeWidth={1}
              />
            ))
          )}
        </svg>

        {ARTWORKS.map((artwork) => (
          <div
            key={artwork.id}
            ref={(el) => {
              boxRefs.current[artwork.id] = el;
            }}
            role="button"
            tabIndex={0}
            aria-label={artwork.id.replace(/-/g, " ")}
            className="absolute cursor-pointer overflow-hidden border border-white"
            style={{
              left: pct(artwork.left, CANVAS_W),
              top: pct(artwork.top, CANVAS_H),
              width: pct(artwork.width, CANVAS_W),
              height: pct(artwork.height, CANVAS_H),
            }}
          >
            <video
              src={artwork.src}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
            {artwork.corners.map((corner) => (
              <span
                key={corner}
                ref={(el) => {
                  markerRefs.current[`${artwork.id}-${corner}`] = el;
                }}
                className="absolute h-0 w-0"
                style={CORNER_STYLE[corner]}
              />
            ))}
          </div>
        ))}

        <div
          className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col items-center justify-center text-center text-white"
          style={{
            left: pct(TEXT_BOX.left + TEXT_BOX.width / 2, CANVAS_W),
            top: pct(TEXT_BOX.top + TEXT_BOX.height / 2, CANVAS_H),
            width: pct(TEXT_BOX.width, CANVAS_W),
          }}
        >
          <p className="redaction-50 text-[clamp(1.6rem,3.8vw,3rem)] not-italic">hannah&rsquo;s mosaic</p>
          <div className="mt-2 flex items-center justify-center gap-3">
            <a href="https://x.com/hannahsmosaic" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/icons8-x-logo-30.png"
                alt="X"
                width={20}
                height={20}
                className="h-[clamp(1.4rem,2.6vw,2.2rem)] w-[clamp(1.4rem,2.6vw,2.2rem)] invert"
              />
            </a>
            <a href="https://www.instagram.com/hannahs.mosaic/" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/icons8-instagram-logo-30.png"
                alt="Instagram"
                width={20}
                height={20}
                className="h-[clamp(1.4rem,2.6vw,2.2rem)] w-[clamp(1.4rem,2.6vw,2.2rem)] invert"
              />
            </a>
            <a href="https://www.tiktok.com/@hannahs.mosaic" target="_blank" rel="noopener noreferrer">
              <Image
                src="/images/icons8-tiktok-logo-30.png"
                alt="TikTok"
                width={20}
                height={20}
                className="h-[clamp(1.4rem,2.6vw,2.2rem)] w-[clamp(1.4rem,2.6vw,2.2rem)] invert"
              />
            </a>
          </div>
          <p className="font-red-hat-mono text-[clamp(0.75rem,1.2vw,1.15rem)]">generative art &amp; mixed media</p>
          <p className="font-red-hat-mono text-[clamp(0.75rem,1.2vw,1.15rem)]">600,000+ viewers</p>
        </div>
      </div>
    </div>
  );
}
