/*
 * Purpose: Layout wrapper for student portal pages — terminal shell.
 */
import React from "react";
import Link from "next/link";

export default function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/student/dashboard" className="flex items-center gap-2 text-sm">
              <span className="text-primary">{"//"}</span>
              <span className="font-semibold tracking-wide text-foreground">lecture</span>
              <span className="font-semibold tracking-wide text-primary glow-text">os</span>
            </Link>
            <span className="term-chip">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              student
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/student/dashboard"
              className="term-caret rounded-sm px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              dashboard
            </Link>
            <Link
              href="/student/enroll"
              className="term-caret rounded-sm px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            >
              enroll
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
