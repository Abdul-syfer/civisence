import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero:
          "relative overflow-hidden rounded-full text-white font-semibold transition-all duration-300 ease-out hover:-translate-y-0.5 [background:linear-gradient(180deg,hsl(200_95%_60%)_0%,hsl(214_95%_52%)_50%,hsl(222_70%_22%)_100%)] [box-shadow:inset_0_1px_0_0_hsl(0_0%_100%/0.4),0_10px_30px_-10px_hsl(214_95%_52%/0.5),0_4px_12px_-4px_hsl(222_70%_22%/0.3)] hover:[box-shadow:inset_0_1px_0_0_hsl(0_0%_100%/0.5),0_18px_40px_-10px_hsl(214_95%_52%/0.65),0_6px_16px_-4px_hsl(222_70%_22%/0.4)] before:content-[''] before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:ease-[cubic-bezier(0.4,0,0.2,1)] before:[background:linear-gradient(110deg,transparent_30%,hsl(0_0%_100%/0.45)_50%,transparent_70%)] before:pointer-events-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        hero: "px-8 py-6 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
