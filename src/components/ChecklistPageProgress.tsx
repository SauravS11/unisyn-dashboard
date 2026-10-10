import { Progress } from "@/components/ui/progress";

interface Props {
  overall: { completion: number; done: number; total: number };
  current: { completion: number; done: number; total: number };
  label?: string;
}

export function ChecklistPageProgress({ overall, current, label = "Category progress" }: Props) {
  return (
    <section aria-label="Checklist progress" className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Overall checklist progress</p>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{overall.done} of {overall.total} requirements completed</p>
          </div>
          <span className="shrink-0 text-3xl sm:text-4xl font-semibold tabular-nums text-foreground">{overall.completion}<span className="text-lg text-muted-foreground">%</span></span>
        </div>
        <Progress value={overall.completion} aria-label="Overall checklist completion" className="h-5 border border-border/60 bg-muted shadow-inner" indicatorClassName="rounded-full bg-gradient-brand duration-700 motion-reduce:transition-none" />
      </div>
      <div className="mt-6 border-t border-border/60 pt-5 space-y-2.5">
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