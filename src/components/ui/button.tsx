import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium appearance-none touch-manipulation transition-[background-color,color,filter] duration-150 ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-icon-stroke",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover [&_svg]:text-primary-foreground",
        secondary:
          "border border-border bg-card text-foreground hover:brightness-[0.94]",
        outline:
          "border border-border bg-card text-foreground hover:brightness-[0.94]",
        ghost: "text-muted-foreground hover:bg-card hover:text-foreground hover:brightness-[0.96]",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-[0.92] [&_svg]:text-destructive-foreground",
        icon: "bg-icon text-icon-stroke hover:bg-icon-hover hover:brightness-[0.94] [&_svg]:text-icon-stroke",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const resolved =
      size === "icon" && (!variant || variant === "outline" || variant === "ghost")
        ? "icon"
        : variant;
    return (
      <Comp
        className={cn(buttonVariants({ variant: resolved, size, className }))}
        ref={ref}
        type={asChild ? undefined : type ?? "button"}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
