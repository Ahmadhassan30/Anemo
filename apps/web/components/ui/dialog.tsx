/*
 * Purpose: Dialog wrapper component placeholder.
 */
import React from "react";

export type DialogProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
};

export function Dialog({ children, className, ...props }: DialogProps) {
  return (
    <div
      role="dialog"
      className={`rounded border border-zinc-800 bg-zinc-900 p-5 ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
