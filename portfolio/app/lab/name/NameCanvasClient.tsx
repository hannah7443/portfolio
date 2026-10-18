"use client";

import dynamic from "next/dynamic";

// The canvas builds its masks with browser canvas APIs on first render,
// so it's loaded client-only (ssr: false has to live in a Client Component).
const NameCanvas = dynamic(() => import("./NameCanvas"), { ssr: false });

export default function NameCanvasClient() {
  return <NameCanvas />;
}
