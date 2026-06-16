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
      className={`rounded-2xl border border-line bg-surface p-6 text-ink shadow-lg ${className ?? ""}`}
      {...props}
    >
      {children}
    </div>
  );
}
