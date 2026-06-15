"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

export const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={`shrink-0 border-0 bg-border ${
        orientation === "horizontal"
          ? "h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"
          : "w-px h-full bg-gradient-to-b from-transparent via-border to-transparent"
      } ${className || ""}`}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName
