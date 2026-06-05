/*
 * Purpose: Card container component for grouped content.
 */
import React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, ...props }: CardProps) {
  return <div {...props}>{children}</div>;
}
