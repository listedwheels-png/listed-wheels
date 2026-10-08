import React from "react";
import { CheckCircle2, Clock, ShieldCheck, Tag, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "verified" | "pending" | "sold" | "featured" | "danger" | "neutral";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  showIcon = true,
  children,
  ...props
}) => {
  const variantStyles = {
    verified: "bg-[#1F9D6B]/15 text-[#1F9D6B] border border-[#1F9D6B]/30",
    pending: "bg-[#C98A00]/15 text-[#C98A00] border border-[#C98A00]/30",
    sold: "bg-ink-500/15 text-ink-700 border border-ink-500/30",
    featured: "bg-accent-500/20 text-ink-900 border border-accent-500/40 font-bold",
    danger: "bg-danger/15 text-danger border border-danger/30",
    neutral: "bg-ink-200/60 text-ink-700 border border-ink-200",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1 font-medium",
    md: "text-xs px-2.5 py-1 gap-1.5 font-semibold",
  };

  const getIcon = () => {
    if (!showIcon) return null;
    switch (variant) {
      case "verified":
        return <ShieldCheck className="w-3.5 h-3.5 shrink-0" />;
      case "pending":
        return <Clock className="w-3.5 h-3.5 shrink-0" />;
      case "sold":
        return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      case "featured":
        return <Tag className="w-3.5 h-3.5 shrink-0" />;
      case "danger":
        return <XCircle className="w-3.5 h-3.5 shrink-0" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full leading-none shrink-0 select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {getIcon()}
      <span>{children}</span>
    </span>
  );
};
