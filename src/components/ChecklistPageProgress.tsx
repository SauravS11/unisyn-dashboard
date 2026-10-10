import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { checklistMilestones } from "@/lib/checklistProgress";

interface Props {
  overall: { completion: number; done: number; total: number };
  current: { completion: number; done: number; total: number };
  label?: string;
  milestones: ReturnType<typeof checklistMilestones>;
  activeCode?: string;
}

export function ChecklistPageProgress({ overall, current, label = "Category progress", milestones, activeCode }: Props) {
  return (
    <section aria-label="Checklist progress" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Overall checklist progress</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{overall.done} of {overall.total} requirements completed</p>
          </div>
          <span className="shrink-0 text-3xl sm:text-4xl font-semibold tabular-nums text-foreground">{overall.completion}<span className="text-lg text-muted-foreground">%</span></span>
        </div>
        <ol aria-label="Category milestones" className={cn("grid gap-x-5 gap-y-6 pt-5", milestones.length > 2 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" : "grid-cols-2")}>
          {milestones.map((milestone) => {
            const active = milestone.code === activeCode;
            return (
              <li key={milestone.code} aria-current={active ? "step" : undefined} aria-label={`${milestone.name}: ${milestone.complete ? "Complete" : `${milestone.done} of ${milestone.total} completed`}`} className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-500 motion-reduce:transition-none", milestone.complete ? "border-success bg-success text-success-foreground" : active ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10" : "border-border bg-muted text-muted-foreground")}>
                    {milestone.complete ? <Check aria-hidden="true" className="h-5 w-5" strokeWidth={3} /> : milestone.code}
                  </span>
                  <span aria-hidden="true" className={cn("h-0.5 flex-1 rounded-full transition-colors duration-500 motion-reduce:transition-none", milestone.complete ? "bg-success/50" : "bg-border")} />
                </div>
                <p className={cn("mt-3 break-words text-sm font-semibold leading-snug", milestone.complete ? "text-success" : "text-foreground")}>{milestone.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{milestone.complete ? "Complete" : `${milestone.done} / ${milestone.total} completed`}</p>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="mx-auto mt-8 max-w-2xl border-t border-border/60 pt-5 space-y-2.5">
        <div className="flex items-center justify-between gap-3 text-sm">
          <p className="font-medium text-foreground">{label}</p>
          <span className="shrink-0 font-semibold tabular-nums text-primary">{current.completion}%</span>
        </div>
        <Progress value={current.completion} aria-label={label} className="h-3 border border-border/50 bg-muted" indicatorClassName="rounded-full bg-primary duration-500 motion-reduce:transition-none" />
        <p className="text-center text-xs text-muted-foreground">{current.done} of {current.total} completed</p>
      </div>
    </section>
  );
}