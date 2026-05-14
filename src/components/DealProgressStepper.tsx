import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type DealStep = "deal" | "team" | "categories" | "checklist";

interface DealProgressStepperProps {
  current: DealStep;
  className?: string;
}

const STEPS: { key: DealStep; label: string; shortLabel: string }[] = [
  { key: "deal", label: "Deal Details", shortLabel: "Deal" },
  { key: "team", label: "Core Team", shortLabel: "Team" },
  { key: "categories", label: "Categories", shortLabel: "Categories" },
  { key: "checklist", label: "Pre-DD Checklist", shortLabel: "Checklist" },
];

export const DealProgressStepper = ({ current, className }: DealProgressStepperProps) => {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  const progressPct = (currentIndex / (STEPS.length - 1)) * 100;

  return (
    <div className={cn("w-full max-w-2xl mx-auto px-2 sm:px-4", className)}>
      <div className="relative">
        {/* Track */}
        <div className="absolute top-4 sm:top-5 left-0 right-0 h-1 bg-border/40 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-red-500 to-red-600"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const isComplete = index < currentIndex;
            const isCurrent = index === currentIndex;
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                  }}
                  className={cn(
                    "relative z-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300",
                    "h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm font-bold",
                    isComplete && "bg-red-500 border-red-500 text-white",
                    isCurrent && "bg-background border-red-500 text-red-500 shadow-[0_0_0_4px_hsl(var(--background)),0_0_0_6px_hsl(0_84%_60%/0.3)]",
                    !isComplete && !isCurrent && "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                </motion.div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium text-center transition-colors",
                    (isCurrent || isComplete) ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
