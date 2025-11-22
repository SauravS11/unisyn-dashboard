import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  isActive?: boolean;
}

interface PageNavigationProps {
  items: NavItem[];
}

export const PageNavigation = ({ items }: PageNavigationProps) => {
  const location = useLocation();

  return (
    <nav className="flex items-center gap-2 bg-background/60 backdrop-blur-xl border-2 border-border/50 rounded-full px-6 py-3 shadow-2xl">
      {items.map((item, index) => {
        const isActive = item.isActive !== undefined 
          ? item.isActive 
          : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
        
        return (
          <div key={item.to} className="flex items-center gap-2">
            {index > 0 && <div className="w-1 h-1 rounded-full bg-border" />}
            <Link
              to={item.to}
              className={cn(
                "relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-red-500/20 text-red-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-red-500/10"
              )}
            >
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-red-500/10 animate-pulse" />
              )}
            </Link>
          </div>
        );
      })}
    </nav>
  );
};
