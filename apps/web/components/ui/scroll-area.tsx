import * as React from "react"

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative overflow-y-auto rounded-2xl scroll-smooth [scrollbar-width:thin] [scrollbar-color:theme(colors.line-strong)_transparent] ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
)
ScrollArea.displayName = "ScrollArea"
