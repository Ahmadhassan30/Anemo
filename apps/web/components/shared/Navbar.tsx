/*
 * Purpose: Top navigation — minimal zinc bar.
 */
import React from "react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="h-12 bg-zinc-900 border-b border-zinc-800 px-6 flex items-center justify-between">
      <Link href="/" className="font-mono font-bold text-zinc-100 text-sm">
        LectureOS
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/login" className="text-zinc-400 hover:text-zinc-200 transition-colors duration-150">
          Sign in
        </Link>
        <Link
          href="/register"
          className="bg-indigo-500 hover:bg-indigo-400 text-white text-xs px-3 py-1.5 rounded transition-colors duration-150"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
