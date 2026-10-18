"use client";

import dynamic from "next/dynamic";

// WebGL can't run during SSR, so the three.js scene loads client-only (ssr: false has to live in a Client Component).
const FlowerThree = dynamic(() => import("./FlowerThree"), { ssr: false });

export default function FlowerLabClient() {
  return <FlowerThree />;
}
