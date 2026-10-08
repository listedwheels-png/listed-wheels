import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-200 ease-out min-h-[44px] min-w-[44px] select-none focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const sizeStyles = {
      sm: "px-3.5 py-1.5 text-xs gap-1.5",
      md: "px-5 py-2.5 text-sm gap-2",
      lg: "px-6 py-3.5 text-base gap-2.5",
    };

    const variantStyles = {
      primary:
        "bg-accent-500 text-ink-900 hover:bg-accent-600 shadow-sm hover:shadow active:bg-accent-600 font-bold",
      secondary:
        "border-2 border-ink-900 text-ink-900 bg-transparent hover:bg-ink-900/5 active:bg-ink-900/10",
      ghost:
        "text-ink-700 hover:text-ink-900 hover:bg-ink-200/50 active:bg-ink-200/80 bg-transparent",
      danger:
        "bg-danger text-surface hover:bg-danger/90 active:bg-danger/95 shadow-sm",
      dark:
        "bg-ink-900 text-surface hover:bg-ink-700 active:bg-ink-900 shadow-sm",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0 mr-1.5" />
        )}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
