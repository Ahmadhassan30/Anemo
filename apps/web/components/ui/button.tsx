import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-accent text-white shadow-sm hover:bg-accent-hover",
  destructive: "bg-danger text-white shadow-sm hover:brightness-105",
  outline: "border border-line bg-surface text-ink hover:bg-fill",
  secondary: "bg-fill text-ink hover:bg-line",
  ghost: "text-subtle hover:bg-fill hover:text-ink",
  link: "text-accent underline-offset-4 hover:underline",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-11 px-5 text-sm",
  sm: "h-9 px-4 text-sm",
  lg: "h-12 px-7 text-base",
  icon: "h-11 w-11",
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
