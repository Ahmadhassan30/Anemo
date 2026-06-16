/*
 * Purpose: Input component wrapper — zinc field styling.
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
          "w-full rounded bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors duration-150 focus:ring-1 focus:ring-indigo-500",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
