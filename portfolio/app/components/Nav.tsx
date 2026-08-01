import Link from "next/link";

const links = [
  { href: "/work", label: "work" },
  { href: "/playground", label: "playground" },
  { href: "/about", label: "about" },
];

export default function Nav() {
  return (
    <nav className="absolute right-0 top-0 flex items-center gap-2 p-6 text-sm">
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
