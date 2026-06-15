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
      className={`term-window rounded-md border border-border bg-card p-5 pt-9 shadow-glow ${className ?? ""}`}
      {...props}
    >
      <div className="term-label mb-3 flex items-center gap-2">
        <span className="term-caret">dialog</span>
        <span className="term-cursor" aria-hidden="true" />
      </div>
      {children}
    </div>
  );
}
