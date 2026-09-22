"use client";

import { useEffect, useRef, useState } from "react";

// A page-wide queue so only one LazyVideo fetches at a time. These clips
// are individually huge (100-200+MB on /work/fig-tree) — with a 600px
// IntersectionObserver head start, two or three of them could become
// eligible in the same scroll and start downloading concurrently, each
// getting a fraction of the connection's bandwidth, which made every one
// of them feel perpetually stuck buffering even though each one alone
// would load reasonably. A video acquires a slot before setting its `src`
// and releases it once enough has buffered to actually play, letting the
// next queued video start with the full connection instead of splitting
// it N ways.
let loadQueue: Promise<void> = Promise.resolve();

function acquireLoadSlot(): Promise<() => void> {
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const myTurn = loadQueue;
  loadQueue = loadQueue.then(() => held);
  return myTurn.then(() => release);
}

/**
 * A `<video>` that defers fetching its `src` until it's about to scroll
 * into view (IntersectionObserver, a modest `rootMargin` head start),
 * and then waits its turn in the shared queue above rather than
 * downloading alongside every other video already in flight. Built for
 * pages like /work/fig-tree that stack several autoplay demo videos down
 * a long scroll. Same autoplay/muted/loop/playsInline behavior as a plain
 * `<video>`.
 */
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [canFetch, setCanFetch] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || nearViewport) return;

    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setNearViewport(true), {
      rootMargin: "200px 0px",
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!nearViewport) return;
    let cancelled = false;

    acquireLoadSlot().then((release) => {
      if (cancelled) {
        release();
        return;
      }
      releaseRef.current = release;
      setCanFetch(true);
    });

    return () => {
      cancelled = true;
      // Releases the slot even if this video unmounts (e.g. fast scroll
      // past it) before ever firing onLoadedData, so a queued video never
      // waits forever on one that left before finishing.
      releaseRef.current?.();
      releaseRef.current = null;
    };
  }, [nearViewport]);

  return (
    <video
      ref={videoRef}
      src={canFetch ? src : undefined}
      className={className}
      autoPlay={canFetch}
      muted
      loop
      playsInline
      preload="none"
      onLoadedData={() => {
        // "Enough to play" rather than "the whole file" — frees the queue
        // for the next video as soon as this one can actually start,
        // without waiting for the full (huge) download to finish.
        releaseRef.current?.();
        releaseRef.current = null;
      }}
    />
  );
}
