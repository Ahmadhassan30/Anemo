/*
 * Purpose: Top navigation bar for the web app.
 */
"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  return (
    <nav className="flex h-12 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-6">
      <span className="font-mono text-sm font-bold text-zinc-100">LectureOS</span>
      <div className="flex items-center">
        {email && <span className="text-xs text-zinc-500">{email}</span>}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="ml-4 text-xs text-zinc-600 transition-colors duration-150 hover:text-zinc-400"
        >
          sign out
        </button>
      </div>
    </nav>
  );
}
