"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NavMarker } from "./markers";
import { LABEL_FONT_SIZE_PX, MARKER_ACCENT_COLOR } from "./labelFont";
import { useHoverFigTree } from "./HoverFigTreeContext";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const isVideo = (src: string) => VIDEO_EXTENSIONS.some((ext) => src.toLowerCase().endsWith(ext));

export default function NavPreviewBox({ marker, size }: { marker: NavMarker; size: number }) {
  const [hovered, setHovered] = useState(false);
  const { activate } = useHoverFigTree();

  return (
    <Link
      href={marker.href}
      className="pointer-events-auto relative block h-full w-full"
      onMouseEnter={() => {
        setHovered(true);
        if (marker.triggersHoverOverlay) activate(marker.triggersHoverOverlay);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setHovered(true);
        if (marker.triggersHoverOverlay) activate(marker.triggersHoverOverlay);
      }}
      onBlur={() => setHovered(false)}
    >
      <span
        className={`font-red-hat-mono pointer-events-none absolute left-0 top-0 px-2 py-1 text-left font-bold uppercase leading-tight ${
          marker.wrapLabel ? "w-full break-words" : "whitespace-nowrap"
        }`}
        style={{ fontSize: LABEL_FONT_SIZE_PX, color: MARKER_ACCENT_COLOR }}
      >
        {marker.label}
      </span>

      {/* Only for markers without their own full-screen hover overlay —
          markers with `triggersHoverOverlay` predate those overlays and
          don't need this small thumbnail popup anymore. */}
      {hovered && !marker.triggersHoverOverlay && (
        <div
          className="font-red-hat-mono pointer-events-none absolute z-10 flex flex-col gap-2 border border-black/40 bg-[var(--background)] p-2 shadow-lg"
          style={{
            left: "100%",
            top: 0,
            width: Math.max(180, size * 1.6),
            marginLeft: 8,
          }}
        >
          <div className="relative aspect-video w-full overflow-hidden bg-black/5">
            {isVideo(marker.thumbnail) ? (
              <video src={marker.thumbnail} className="h-full w-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <Image src={marker.thumbnail} alt={marker.label} fill className="object-cover" />
            )}
          </div>
          <span className="text-sm">{marker.label}</span>
        </div>
      )}
    </Link>
  );
}
