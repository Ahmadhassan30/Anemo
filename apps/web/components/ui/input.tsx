/*
 * Purpose: Input component wrapper — Apple-minimal field.
 */
import React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] text-ink",
          "placeholder:text-faint transition-shadow duration-200",
          "focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/12",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
