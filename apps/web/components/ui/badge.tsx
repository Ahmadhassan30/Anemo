/*
 * Purpose: Badge component for status labels.
 */
import React from "react";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, ...props }: BadgeProps) {
  return <span {...props}>{children}</span>;
}
