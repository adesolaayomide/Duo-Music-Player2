import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Slot } from "@radix-ui/react-slot";

// ─────────────────────────────────────────────
//  Button
// ─────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render as child component (Radix Slot) */
  asChild?: boolean;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-bg-base font-bold hover:scale-[1.04] active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-accent",
  secondary:
    "bg-transparent border border-text-secondary text-text-primary hover:border-text-primary focus-visible:ring-2 focus-visible:ring-white",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-white",
  danger:
    "bg-danger text-white font-bold hover:opacity-90 focus-visible:ring-2 focus-visible:ring-danger",
  icon: "bg-transparent text-text-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-4 text-sm rounded-full",
  md: "h-10 px-6 text-sm rounded-full",
  lg: "h-12 px-8 text-base rounded-full",
  icon: "h-10 w-10 rounded-full flex items-center justify-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      asChild = false,
      isLoading = false,
      className,
      disabled,
      children,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-fast outline-none",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {isLoading ? (
          <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";
