import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-sm font-medium tracking-wide transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "border-primary bg-primary text-primary-foreground shadow-glow hover:brightness-110",
  destructive: "border-destructive/60 bg-transparent text-destructive hover:border-destructive",
  outline: "border-border bg-transparent text-foreground hover:border-primary/60 hover:text-primary",
  secondary: "border-border bg-secondary text-secondary-foreground hover:border-primary/50",
  ghost: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:text-primary",
  link: "border-transparent bg-transparent text-primary underline-offset-4 hover:underline",
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
