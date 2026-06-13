import * as React from "react"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`relative overflow-y-auto ${className || ""}`} {...props}>
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"
