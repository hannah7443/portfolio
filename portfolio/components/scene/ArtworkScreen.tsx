"use client";

import { useCallback, useRef, useState } from "react";
import { ARTWORK_CLIPS } from "@/lib/artworks";

export default function ArtworkScreen() {
  const [index, setIndex] = useState(0);
  const wheelLock = useRef(false);

  const step = useCallback((dir: 1 | -1) => {
    setIndex((i) => (i + dir + ARTWORK_CLIPS.length) % ARTWORK_CLIPS.length);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (wheelLock.current) return;
      wheelLock.current = true;
      step(e.deltaY > 0 ? 1 : -1);
      setTimeout(() => {
        wheelLock.current = false;
      }, 350);
    },
    [step]
  );

  const clip = ARTWORK_CLIPS[index];

  return (
    <div
      onWheel={onWheel}
      style={{
        width: "100%",
        height: "100%",
        background: "#0c0818",
        display: "flex",
        flexDirection: "column",
        color: "#eae6ff",
        fontFamily: "var(--font-red-hat-mono, monospace)",
      }}
    >
      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <video
          key={clip.id}
          src={clip.src}
          autoPlay
          loop
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 10px",
          fontSize: 10,
          letterSpacing: 0.5,
          borderTop: "1px solid rgba(234,230,255,0.15)",
        }}
      >
        <button
          onClick={() => step(-1)}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          aria-label="previous artwork"
        >
          ‹
        </button>
        <span>
          {clip.label} — {index + 1}/{ARTWORK_CLIPS.length}
        </span>
        <button
          onClick={() => step(1)}
          style={{ background: "none", border: "none", color: "inherit", cursor: "pointer" }}
          aria-label="next artwork"
        >
          ›
        </button>
      </div>
    </div>
  );
}
