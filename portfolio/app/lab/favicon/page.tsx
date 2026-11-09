import type { Metadata } from "next";
import FaviconLabClient from "./FaviconLabClient";

// Renders the lily's head (no stem or leaves) on a transparent square: the source render that
// app/icon.png, app/apple-icon.png and app/favicon.ico were trimmed and scaled down from.

export const metadata: Metadata = {
  title: "lily — favicon",
};

export default function FaviconLabPage() {
  return (
    <main className="flex h-screen w-full items-center justify-center bg-neutral-800">
      <FaviconLabClient />
    </main>
  );
}
