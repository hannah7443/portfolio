"use client";

import Link from "next/link";

// Playground has no standalone route anymore — it's a hover-only overlay
// on the homepage flower (see app/components/spline/HoverPlayground.tsx),
// so it's dropped from the nav rather than linking to a page that no
// longer exists.
const links = [
  { href: "/work", label: "work" },
  { href: "/about", label: "about" },
];

export default function Nav() {
  return (
    <nav className="absolute right-0 top-0 flex items-center gap-2 p-6 font-red-hat-mono text-sm">
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-2">
          {i > 0 && <span className="text-black/40">|</span>}
          <Link href={link.href} className="hover:underline">
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
