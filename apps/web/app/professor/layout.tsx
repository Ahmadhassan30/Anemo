/*
 * Purpose: Layout wrapper for professor portal pages — terminal shell.
 */
import React from "react";
import Link from "next/link";

export default function ProfessorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/professor/dashboard" className="flex items-center gap-2 text-sm">
              <span className="text-primary">{"//"}</span>
              <span className="font-semibold tracking-wide text-foreground">lecture</span>
              <span className="font-semibold tracking-wide text-primary glow-text">os</span>
            </Link>
            <span className="term-chip">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              professor
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/professor/dashboard"
              className="term-caret rounded-sm px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              dashboard
            </Link>
            <Link
              href="/professor/upload"
              className="term-caret rounded-sm px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              upload
            </Link>
            <Link
              href="/professor/settings"
              className="term-caret rounded-sm px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              settings
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
