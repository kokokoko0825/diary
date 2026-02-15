"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "~/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "glass-subtle relative h-2.5 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 rounded-full transition-all"
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          background: "linear-gradient(90deg, oklch(0.55 0.2 265), oklch(0.6 0.22 290))",
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
