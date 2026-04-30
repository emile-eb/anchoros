import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/18",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--color-primary)] text-white hover:bg-[#0e1116]",
        secondary: "border border-[color:var(--color-border)] bg-[color:var(--color-muted)] text-neutral-900 hover:bg-[#f0f2f5]",
        outline: "border border-[color:var(--color-border)] bg-white text-neutral-900 hover:bg-[#f8fafc]",
        ghost: "text-neutral-600 hover:bg-[#f3f4f6] hover:text-neutral-950",
      },
      size: {
        default: "h-8.5 px-3.5 py-2",
        sm: "h-8 rounded-[6px] px-2.5",
        lg: "h-9.5 rounded-[6px] px-4",
        icon: "size-8.5 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
