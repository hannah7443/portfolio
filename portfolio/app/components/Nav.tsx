"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/work", label: "work" },
  { href: "/playground", label: "playground" },
  { href: "/about", label: "about" },
];

export default function Nav() {
  const pathname = usePathname();
  const isPlayground = pathname?.startsWith("/playground");

  return (
    <nav
      className={`absolute right-0 top-0 flex items-center gap-2 p-6 font-red-hat-mono text-sm ${
        isPlayground ? "text-white" : ""
      }`}
    >
      {links.map((link, i) => (
        <span key={link.href} className="flex items-center gap-2">
          {i > 0 && <span className={isPlayground ? "text-white/40" : "text-black/40"}>|</span>}
          <Link href={link.href} className="hover:underline">
            {link.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
