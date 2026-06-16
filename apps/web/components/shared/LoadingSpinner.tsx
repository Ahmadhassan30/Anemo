/*
 * Purpose: Loading indicator for async states.
 */
import React from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 text-sm text-subtle", className)}>
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-line border-t-accent" />
      {message && <span>{message}</span>}
    </div>
  );
}
