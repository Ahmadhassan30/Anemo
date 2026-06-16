/*
 * Purpose: Sidebar navigation for portal views.
 */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarItem {
  label: string;
  href: string;
}

export function Sidebar({ items = [] }: { items?: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface/60 p-3">
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent/10 text-accent" : "text-subtle hover:bg-fill hover:text-ink"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3.5 py-2 text-xs text-faint">v0.1.0</div>
    </aside>
  );
}
