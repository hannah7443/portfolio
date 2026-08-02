import Link from "next/link";

export function BackToProjects() {
  return (
    <Link
      href="/work"
      className="font-red-hat-mono fixed left-6 top-6 z-20 flex items-center gap-2 text-sm hover:underline"
    >
      <span aria-hidden="true">&larr;</span>
      back to projects
    </Link>
  );
}

export type NavItem = {
  label: string;
  id: string;
  children?: NavItem[];
};

export function Sidebar({ items }: { items: NavItem[] }) {
  return (
    <nav className="font-red-hat-mono fixed left-0 top-0 flex h-screen w-56 flex-col gap-1 overflow-y-auto p-6 pt-24 text-sm">
      {items.map((item) => (
        <div key={item.id}>
          <a href={`#${item.id}`} className="block py-1 hover:underline">
            {item.label}
          </a>
          {item.children && (
            <div className="ml-3 flex flex-col gap-1 border-l border-black/20 pl-3">
              {item.children.map((child) => (
                <a key={child.id} href={`#${child.id}`} className="block py-1 text-xs hover:underline">
                  {child.label}
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export function Section({
  id,
  title,
  titleClassName,
  children,
}: {
  id: string;
  title: string;
  titleClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 py-6">
      <h2 className={`redaction-50 ${titleClassName ?? "text-3xl"}`}>{title}</h2>
      <div className="mt-4 text-sm text-black/70">{children}</div>
    </section>
  );
}
