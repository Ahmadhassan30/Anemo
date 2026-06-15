/*
 * Purpose: Layout wrapper for student portal pages.
 */
import React from "react";
import Link from "next/link";

export default function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="font-mono font-bold text-zinc-100 text-sm">
              LectureOS
            </Link>
            <span className="pill bg-indigo-950 text-indigo-400 border-indigo-800">
              student
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/student/dashboard"
              className="px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors duration-150"
            >
              Dashboard
            </Link>
            <Link
              href="/student/enroll"
              className="px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 rounded transition-colors duration-150"
            >
              Enroll
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

