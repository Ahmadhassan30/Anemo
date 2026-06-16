/*
 * Purpose: Layout wrapper for professor portal pages.
 * Minimal chrome — each page owns its own header per the design system.
 */
import React from "react";

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-canvas text-ink">{children}</div>;
}
