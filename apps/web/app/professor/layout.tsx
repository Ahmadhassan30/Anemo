/*
 * Purpose: Layout wrapper for professor portal pages.
 */
import React from "react";
import Link from "next/link";

export default function ProfessorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/professor/dashboard" className="font-mono font-bold text-zinc-100 text-sm">
            LectureOS
          </Link>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/professor/dashboard"
            className="px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors duration-150"
          >
            Dashboard
          </Link>
          <Link
            href="/professor/upload"
            className="px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors duration-150"
          >
            Upload
          </Link>
          <Link
            href="/professor/settings"
            className="px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors duration-150"
          >
            Settings
          </Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
