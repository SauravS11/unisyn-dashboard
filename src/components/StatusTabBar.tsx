import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusTabTone = "red" | "yellow" | "blue" | "green";

export interface StatusTab {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: number;
  tone: StatusTabTone;
}

const TONE_STYLES: Record<
  StatusTabTone,
  { background: string; borderColor: string; boxShadow: string; text: string; count: string }
> = {
  red: {
    background: "hsl(var(--primary) / 0.18)",
    borderColor: "hsl(var(--primary) / 0.55)",
    boxShadow: "0 8px 24px -10px hsl(var(--primary) / 0.6)",
    text: "text-primary",
    count: "text-primary/80",
  },
  yellow: {
    background: "hsl(var(--warning) / 0.2)",
    borderColor: "hsl(var(--warning) / 0.6)",
    boxShadow: "0 8px 24px -10px hsl(var(--warning) / 0.6)",
    text: "text-warning",
    count: "text-warning/85",
  },
  blue: {
    background: "hsl(var(--info) / 0.18)",
    borderColor: "hsl(var(--info) / 0.55)",
    boxShadow: "0 8px 24px -10px hsl(var(--info) / 0.6)",
    text: "text-info",
    count: "text-info-foreground/80",
  },
  green: {
    background: "hsl(var(--success) / 0.18)",
    borderColor: "hsl(var(--success) / 0.55)",
    boxShadow: "0 8px 24px -10px hsl(var(--success) / 0.6)",
    text: "text-success",
    count: "text-success/85",
  },
};

/**
 * Card accents matching the tab tones, so list cards adopt the colour of the
 * status tab they appear under (shared by the M&A and funding lists).
 */
export const STATUS_CARD_TONES: Record<StatusTabTone, { border: string; badge: string }> = {
  red: {
    border: "border-primary/40 hover:border-primary/60",
    badge: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/15",
  },
  yellow: {
    border: "border-warning/40 hover:border-warning/60",
    badge: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15",
  },
  blue: {
    border: "border-info/40 hover:border-info/60",
    badge: "bg-info/15 text-info-foreground border-info/30 hover:bg-info/15",
  },
  green: {
    border: "border-success/40 hover:border-success/60",
    badge: "bg-success/15 text-success border-success/30 hover:bg-success/15",
  },
};
  tabs: StatusTab[];
  activeId: string;
  onChange: (id: string) => void;
  label?: string;
}

/**
 * Glass status tab bar with a sliding, tone-coloured indicator (framer-motion spring).
 * Used by the M&A deals list and the funding applications list so both animate identically.
 */
export const StatusTabBar = ({ tabs, activeId, onChange, label = "Status" }: StatusTabBarProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const [bar, setBar] = useState<{ left: number; width: number } | null>(null);

  const measure = useCallback(() => {
    const active = tabRefs.current.get(activeId);
    const container = containerRef.current;
    if (!active || !container) return;
    const a = active.getBoundingClientRect();
    const c = container.getBoundingClientRect();
    setBar({ left: a.left - c.left, width: a.width });
  }, [activeId]);

  useEffect(() => {
    measure();
    const raf = requestAnimationFrame(measure);
    const timeout = window.setTimeout(measure, 300); // after fonts settle
    window.addEventListener("resize", measure);
    const active = tabRefs.current.get(activeId);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
  }, [measure, activeId]);

  const activeTone = tabs.find((t) => t.id === activeId)?.tone ?? "red";
  const tone = TONE_STYLES[activeTone];

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={label}
      className="relative inline-flex max-w-full items-center gap-1 overflow-x-auto bg-background/60 backdrop-blur-xl border-2 border-border/50 rounded-3xl sm:rounded-full px-2 py-2 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {bar && (
        <motion.div
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-full border-2 pointer-events-none motion-safe"
          initial={false}
          animate={{
            left: bar.left,
            width: bar.width,
            backgroundColor: tone.background,
            borderColor: tone.borderColor,
            boxShadow: tone.boxShadow,
          }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        const tabTone = TONE_STYLES[tab.tone];
        return (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) tabRefs.current.set(tab.id, el);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 flex shrink-0 items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 touch-manipulation",
              isActive ? tabTone.text : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn("text-xs tabular-nums", isActive ? tabTone.count : "")}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
