import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-zinc-700 bg-zinc-800 text-zinc-300",
  secondary: "border-zinc-800 bg-zinc-900 text-zinc-400",
  destructive: "border-red-800 bg-red-950 text-red-400",
  outline: "border-zinc-700 text-zinc-400",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
