import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "focus-visible:ring-ring/60 aria-invalid:border-destructive inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-bold whitespace-nowrap outline-none transition-[transform,box-shadow] focus-visible:ring-4 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:transition-none disabled:translate-0 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-[var(--ink)] shadow-[3px_3px_0_0_var(--honey)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--honey)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:bg-muted disabled:text-muted-foreground",
        honey:
          "bg-honey border-2 border-[var(--ink)] text-[#2b1b30] shadow-sticker hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--ink)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:bg-muted disabled:text-muted-foreground",
        mint: "bg-mint border-2 border-[var(--ink)] text-[#2b1b30] shadow-sticker hover:-translate-x-px hover:-translate-y-px active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:bg-muted disabled:text-muted-foreground",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-[var(--ink)] hover:opacity-90",
        outline:
          "bg-card border-2 border-[var(--ink)] text-foreground hover:bg-accent disabled:bg-muted! disabled:text-muted-foreground! disabled:opacity-100!",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-transparent hover:border-[var(--ink)]",
        ghost: "hover:bg-accent text-foreground",
        link: "text-foreground rounded-none underline decoration-2 underline-offset-4 hover:decoration-[var(--honey)]",
        invert: "bg-foreground text-background hover:opacity-90",
        success: "bg-success text-success-foreground hover:opacity-90",
        warning: "bg-warning text-warning-foreground hover:opacity-90",
      },
      size: {
        default: "h-11 px-5 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 text-[13px] has-[>svg]:px-3",
        lg: "h-13 px-7 text-base has-[>svg]:px-6",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
