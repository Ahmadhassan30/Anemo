import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline";
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-primary/40 bg-primary/10 text-primary",
  secondary: "border-border bg-secondary text-secondary-foreground",
  destructive: "border-destructive/40 bg-destructive/10 text-destructive",
  outline: "border-border text-muted-foreground",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-medium tracking-wide transition-colors",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
