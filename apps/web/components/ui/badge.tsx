import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-accent/10 text-accent",
  secondary: "bg-fill text-subtle",
  destructive: "bg-danger/10 text-danger",
  outline: "border border-line text-subtle",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
