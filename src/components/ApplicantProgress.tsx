import { Progress } from "@/components/ui/progress";

interface ApplicantProgressProps {
  completion: number;
  done: number;
  total: number;
}

export function ApplicantProgress({ completion, done, total }: ApplicantProgressProps) {
  return (
    <section aria-label="Overall progress" className="mt-6 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Overall progress</p>
          <p className="mt-1 text-sm text-muted-foreground">{done} of {total} requirements completed</p>
        </div>
        <span className="text-4xl font-semibold tabular-nums text-foreground">{completion}<span className="text-xl text-muted-foreground">%</span></span>
      </div>
      <Progress
        value={completion}
        aria-label="Requirements completed"
        className="h-5 border border-border/60 bg-muted"
        indicatorClassName="rounded-full bg-gradient-brand duration-700 motion-reduce:transition-none"
      />
    </section>
  );
}