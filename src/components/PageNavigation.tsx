import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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

  return (
    <nav aria-label={label} className="flex max-w-full flex-wrap justify-center items-center gap-2 bg-background/60 backdrop-blur-xl border-2 border-border/50 rounded-3xl sm:rounded-full px-6 py-3 shadow-2xl">
      {items.map((item, index) => {
        const isActive = item.isActive !== undefined 
          ? item.isActive 
          : location.pathname === item.to;
        
        return (
          <div key={item.to} className="flex items-center gap-2">
            {index > 0 && <div className="w-1 h-1 rounded-full bg-border" />}
            <Link
              to={item.to}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
              )}
            >
              {item.icon && <item.icon className="relative z-10 h-4 w-4 shrink-0" />}
              <span className="relative z-10">{item.label}</span>
              {item.count !== undefined && <span className="relative z-10 text-xs tabular-nums">{item.count}</span>}
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary/10 motion-safe:animate-pulse" />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
