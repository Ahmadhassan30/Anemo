/*
 * Purpose: Layout wrapper for student portal pages.
 * Minimal chrome — each page owns its own layout per the design system.
 */
import React from "react";

export default function StudentLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-300">{children}</div>;
}
