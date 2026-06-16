/*
 * Purpose: Loading indicator for async states.
 */
import React from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  message = "loading...",
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-xs text-zinc-500", className)}>
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      <span className="animate-pulse">$ {message}</span>
    </div>
  );
}
