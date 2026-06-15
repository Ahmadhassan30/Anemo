/*
 * Purpose: Loading indicator for async states — terminal style.
 */
import React from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ label = "loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <span className="term-prompt text-primary" />
      <span>{label}</span>
      <span className="term-cursor" aria-hidden />
    </div>
  );
}
