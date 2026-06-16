/*
 * Purpose: Top navigation bar for the web app.
 */
"use client";

import React from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "";

  return (
    <nav className="glass sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ink text-white">L</span>
          LectureOS
        </Link>
        <div className="flex items-center gap-4">
          {email && <span className="text-sm text-subtle">{email}</span>}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm font-medium text-subtle transition-colors hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
