"use client";

import Link from "next/link";

const links = [
  { href: "/work", label: "work" },
  { href: "/playground", label: "playground" },
  { href: "/about", label: "about" },
];

export default function Nav() {
  return (
    <nav className="absolute left-0 top-0 z-30 flex flex-col gap-2 p-6 font-red-hat-mono text-sm text-white">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="hover:underline">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
