import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const DotArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    {/* First Column */}
    <circle cx="8" cy="8" r="1.6" />
    <circle cx="8" cy="12" r="1.6" />
    <circle cx="8" cy="16" r="1.6" />
    {/* Second Column */}
    <circle cx="12" cy="10" r="1.6" />
    <circle cx="12" cy="14" r="1.6" />
    {/* Third Column */}
    <circle cx="16" cy="12" r="1.6" />
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-[#1C1F26] text-white  hover:bg-[#252a33] dark:bg-white dark:text-[#1C1F26] dark:hover:bg-white/90 rounded-xl p-1",
        destructive:
          "bg-destructive text-destructive-foreground  border border-destructive-border",
        outline:
          " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none ",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
        ghost: "border border-transparent",
      },
      size: {
        default: "h-auto min-h-9",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-12 rounded-xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  icon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, icon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    if (variant === "default" || !variant) {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }), "group flex items-center")}
          ref={ref}
          {...props}
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#D4FF33] text-[#1C1F26] dark:bg-[#1C1F26] dark:text-[#D4FF33] group-hover:scale-95 transition-transform shrink-0">
            {icon || <DotArrow />}
          </span>
          <span className="flex-1 text-center font-semibold">{children}</span>
          <div className="w-4 shrink-0" /> {/* Spacer for visual balance */}
        </Comp>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
