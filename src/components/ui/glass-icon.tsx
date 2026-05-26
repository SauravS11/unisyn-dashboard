import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Size = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<Size, { box: string; icon: number }> = {
  sm: { box: "h-9 w-9 rounded-xl", icon: 16 },
  md: { box: "h-11 w-11 rounded-2xl", icon: 20 },
  lg: { box: "h-14 w-14 rounded-2xl", icon: 24 },
  xl: { box: "h-16 w-16 rounded-[20px]", icon: 28 },
};

interface GlassIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon;
  size?: Size;
  tone?: "brand" | "neutral";
}

export const GlassIcon = React.forwardRef<HTMLSpanElement, GlassIconProps>(
  ({ icon: Icon, size = "md", tone = "brand", className, ...props }, ref) => {
    const s = sizeMap[size];
    return (
      <span
        ref={ref}
        className={cn("glass-tile shrink-0", tone === "neutral" && "glass-tile-neutral", s.box, className)}
        {...props}
      >
        <Icon size={s.icon} strokeWidth={1.75} />
      </span>
    );
  },
);
GlassIcon.displayName = "GlassIcon";
