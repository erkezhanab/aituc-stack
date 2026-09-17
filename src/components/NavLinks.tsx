"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLinks({ links }: { links: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav className="order-last flex w-full gap-0.5 overflow-x-auto md:order-none md:w-auto">
      {links.map((l) => {
        const active = path === l.href || (l.href.split("/").length > 2 && path.startsWith(l.href));
        return (
          <Link key={l.href} href={l.href} className={`nav-link ${active ? "nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
