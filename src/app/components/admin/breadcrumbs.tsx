"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function toTitle(segment: string) {
  if (!segment) return "";
  return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminBreadcrumbs() {
  const pathname = usePathname() || "/admin";
  // Only show crumbs for deeper paths than /admin
  if (pathname === "/admin") return null;

  const [, root, ...rest] = pathname.split("/"); // ["", "admin", ...]
  const crumbs = rest.map((seg, i) => {
    const href = ["", root, ...rest.slice(0, i + 1)].join("/") || "/";
    return { label: toTitle(seg), href };
  });

  return (
    <nav className="mb-4 md:mb-6">
      <ol className="flex items-center gap-2 text-xs text-white/70">
        <li>
          <Link href="/admin" className="hover:text-white">Dashboard</Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.href} className="flex items-center gap-2">
            <span className="text-white/30">/</span>
            {i < crumbs.length - 1 ? (
              <Link href={c.href} className="hover:text-white">{c.label}</Link>
            ) : (
              <span className="text-white/90">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

