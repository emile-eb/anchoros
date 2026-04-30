import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center rounded-[5px] border px-1.5 py-0.5 text-[10px] font-medium tracking-[0.05em] uppercase leading-none", {
  variants: {
    variant: {
      default: "border-[#e5e7eb] bg-[#f8fafc] text-[#4b5563]",
      success: "border-[#d4e6dc] bg-[#f3faf6] text-[#35634b]",
      warning: "border-[#e8d7ae] bg-[#faf7ee] text-[#876329]",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
