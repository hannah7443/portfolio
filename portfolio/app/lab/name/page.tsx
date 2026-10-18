import type { Metadata } from "next";
import NameCanvasClient from "./NameCanvasClient";

// "hannah shin" Mixed Media Letters — see app/hannah-shin-motion-spec.md.

export const metadata: Metadata = {
  title: "hannah shin — mixed media letters",
};

export default function NameLabPage() {
  return (
    <main className="h-screen w-full">
      <NameCanvasClient />
    </main>
  );
}
