import * as React from "react";
import { cn } from "@/lib/utils";

interface PageShellProps extends React.HTMLAttributes<HTMLDivElement> {
  orbs?: boolean;
  mesh?: boolean;
}

/** Shared page wrapper: ambient orbs + soft mesh background for visual cohesion. */
export const PageShell = ({ orbs = true, mesh = true, className, children, ...props }: PageShellProps) => (
  <div
    className={cn(
      "min-h-screen relative overflow-hidden bg-background",
      mesh && "bg-mesh",
      className,
    )}
    {...props}
  >
    {orbs && <div className="ambient-orbs" />}
    <div className="relative z-10">{children}</div>
  </div>
);
