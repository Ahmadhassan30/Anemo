/*
 * Purpose: Top navigation for the web app — terminal title bar.
 */
import React from "react";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm">
          <span className="text-primary">{"//"}</span>
          <span className="font-semibold tracking-wide text-foreground">lecture</span>
          <span className="font-semibold tracking-wide text-primary glow-text">os</span>
        </Link>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/login" className="term-link">
            sign_in
          </Link>
          <Link href="/register" className="term-btn term-btn-primary h-8 px-3 text-xs">
            get_started
          </Link>
        </div>
      </div>
    </nav>
  );
}
