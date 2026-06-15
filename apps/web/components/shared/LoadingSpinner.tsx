/*
 * Purpose: Loading indicator — indigo spinning ring with optional message.
 */
import React from "react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ message, className }: { message?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="border-2 border-indigo-500 border-t-transparent rounded-full w-4 h-4 animate-spin" />
      {message && (
        <span className="font-mono text-xs text-zinc-500">{message}</span>
      )}
    </div>
  );
}
