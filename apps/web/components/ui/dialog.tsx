/*
 * Purpose: Dialog wrapper component placeholder.
 */
import React from "react";

export type DialogProps = React.HTMLAttributes<HTMLDivElement> & {
  open?: boolean;
};

export function Dialog({ children, ...props }: DialogProps) {
  return <div {...props}>{children}</div>;
}
