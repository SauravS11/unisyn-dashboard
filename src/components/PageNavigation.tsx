import type React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { useDraggableTabs } from "@/hooks/useDraggableTabs";

interface NavItem {
  to: string;
  label: string;
  isActive?: boolean;
  icon?: LucideIcon;
  count?: number;
}

interface PageNavigationProps {
  items: NavItem[];
  label?: string;
}

export const PageNavigation = ({ items, label = "Page navigation" }: PageNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTo = items.find((item) =>
    item.isActive !== undefined ? item.isActive : location.pathname === item.to
  )?.to;

  const { containerRef, setItemRef, bar, shownId, containerProps } = useDraggableTabs(activeTo, (to) => navigate(to));

  return (
    <nav
      ref={containerRef as React.RefObject<HTMLElement>}
      {...containerProps}
      aria-label={label}
      className="relative flex max-w-full flex-wrap justify-center items-center gap-3 bg-background/60 backdrop-blur-xl border-2 border-border/50 rounded-3xl sm:rounded-full px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xl select-none touch-pan-y"
    >
      {bar && (
        <motion.div
          aria-hidden="true"
          className="absolute rounded-full bg-primary/20 pointer-events-none"
          initial={false}
          animate={{ left: bar.left, top: bar.top, width: bar.width, height: bar.height }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {items.map((item, index) => {
        const isActive = item.to === shownId;
        return (
          <div key={item.to} className="flex items-center gap-2">
            {index > 0 && <div className="w-1 h-1 rounded-full bg-border" />}
            <Link
              ref={setItemRef(item.to)}
              to={item.to}
              draggable={false}
              aria-current={item.to === activeTo ? "page" : undefined}
              className={cn(
                "relative z-10 flex items-center gap-2.5 px-6 py-3 sm:px-7 sm:py-3.5 rounded-full text-base sm:text-lg font-semibold tracking-tight transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />}
              <span>{item.label}</span>
              {item.count !== undefined && <span className="text-sm sm:text-base tabular-nums font-bold">{item.count}</span>}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
