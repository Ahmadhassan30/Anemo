/*
 * Purpose: Sidebar navigation for portal views — terminal file-tree style.
 */
import React from "react";
import Link from "next/link";

export interface SidebarItem {
  label: string;
  href: string;
}

export function Sidebar({ items = [], heading = "nav" }: { items?: SidebarItem[]; heading?: string }) {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-card/40 p-4">
      <p className="term-label mb-3">{`// ${heading}`}</p>
      <nav className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="term-caret rounded-sm px-2 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
