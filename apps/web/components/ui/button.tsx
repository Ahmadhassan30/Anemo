import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-indigo-500 text-white hover:bg-indigo-400",
  destructive: "border border-red-800 bg-red-950 text-red-400 hover:border-red-700",
  outline: "border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100",
  secondary: "bg-zinc-800 text-zinc-200 hover:bg-zinc-700",
  ghost: "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
  link: "text-indigo-400 underline-offset-4 hover:underline",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(BASE, VARIANTS[variant], SIZES[size], className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
