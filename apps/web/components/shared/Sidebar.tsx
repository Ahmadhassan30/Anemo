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
    <aside className="flex w-48 flex-col border-r border-zinc-800 bg-zinc-900">
      <nav className="flex flex-1 flex-col py-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 rounded px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-indigo-950 text-indigo-400"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 font-mono text-[10px] text-zinc-700">v0.1.0</div>
    </aside>
  );
}
