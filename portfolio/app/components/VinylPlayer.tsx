"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 6;
const FRAME_INTERVAL_MS = 100;

export default function VinylPlayer() {
  const [frame, setFrame] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setFrame((prev) => (prev % FRAME_COUNT) + 1);
      }, FRAME_INTERVAL_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  return (
    <button
      type="button"
      onClick={() => setIsPlaying((prev) => !prev)}
      aria-label={isPlaying ? "Pause vinyl player" : "Play vinyl player"}
      className="relative h-[780px] w-[780px] sm:h-[1050px] sm:w-[1050px]"
    >
      {Array.from({ length: FRAME_COUNT }, (_, i) => i + 1).map((n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={n}
          src={`/vinyl-player/vinyl-${n}.png`}
          alt="Vinyl player"
          className="absolute inset-0 h-full w-full object-contain"
          style={{ opacity: n === frame ? 1 : 0 }}
        />
      ))}
    </button>
  );
}
