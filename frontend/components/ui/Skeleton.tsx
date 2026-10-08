import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  aspectRatio?: "4/3" | "16/9" | "1/1" | "auto";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  aspectRatio = "auto",
  ...props
}) => {
  const aspectStyles = {
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-[16/9]",
    "1/1": "aspect-square",
    auto: "",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-ink-200/70 rounded-md",
        aspectStyles[aspectRatio],
        className
      )}
      {...props}
    />
  );
};
