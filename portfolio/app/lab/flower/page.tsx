import type { Metadata } from "next";
import FlowerLabClient from "./FlowerLabClient";

// Test bed: the homepage lily rebuilt in three.js (from public/models/lily.glb), to compare against the Spline version.

export const metadata: Metadata = {
  title: "lily — three.js",
};

export default function FlowerLabPage() {
  return (
    <main className="h-screen w-full bg-black">
      <FlowerLabClient />
    </main>
  );
}
