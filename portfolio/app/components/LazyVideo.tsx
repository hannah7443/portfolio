"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A `<video>` that defers fetching its `src` until it's about to scroll
 * into view (IntersectionObserver, `rootMargin` gives it a head start
 * before it's actually on screen), instead of every video on the page
 * starting to download the moment the page mounts. Built for pages like
 * /work/fig-tree that stack several autoplay demo videos down a long
 * scroll — without this, the browser fetches all of them at once on load,
 * which is what was making videos further down feel slow/stuck buffering.
 * Same autoplay/muted/loop/playsInline props as a plain `<video>`.
 */
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldLoad(true);
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? src : undefined}
      className={className}
      autoPlay={shouldLoad}
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
