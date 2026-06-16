/*
 * Purpose: Layout wrapper for professor portal pages.
 * Minimal chrome — each page owns its own header/top-bar per the design system.
 */
import React from "react";

export default function ProfessorLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-zinc-950 text-zinc-300">{children}</div>;
}
