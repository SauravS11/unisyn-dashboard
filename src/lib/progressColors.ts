// Color tokens for progress / status awareness across the app.
// Green = 100% complete only. Below 100% uses amber/orange/red scale.

export const getProgressColors = (pct: number) => {
  if (pct >= 100) return {
    text: "text-green-600 dark:text-green-500",
    bg: "bg-green-500/15",
    ring: "border-green-500/40",
    bar: "bg-green-500",
    stroke: "text-green-500",
    label: "Complete",
  };
  if (pct >= 75) return {
    text: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-500/15",
    ring: "border-amber-500/40",
    bar: "bg-amber-500",
    stroke: "text-amber-500",
    label: "On Track",
  };
  if (pct >= 40) return {
    text: "text-amber-600 dark:text-amber-500",
    bg: "bg-amber-500/15",
    ring: "border-amber-500/40",
    bar: "bg-amber-500",
    stroke: "text-amber-500",
    label: "In Progress",
  };
  if (pct > 0) return {
    text: "text-orange-600 dark:text-orange-500",
    bg: "bg-orange-500/15",
    ring: "border-orange-500/40",
    bar: "bg-orange-500",
    stroke: "text-orange-500",
    label: "Outstanding",
  };
  return {
    text: "text-red-800 dark:text-red-600",
    bg: "bg-red-700/15",
    ring: "border-red-700/40",
    bar: "bg-red-700",
    stroke: "text-red-700",
    label: "Not Started",
  };
};

export const getStatusColors = (status: string) => {
  switch (status) {
    case "completed":
      return { text: "text-green-600 dark:text-green-500", bg: "bg-green-500/15", border: "border-green-500/30", label: "Completed" };
    case "in_progress":
      return { text: "text-orange-600 dark:text-orange-500", bg: "bg-orange-500/15", border: "border-orange-500/30", label: "In Progress" };
    case "active":
      return { text: "text-blue-600 dark:text-blue-500", bg: "bg-blue-500/15", border: "border-blue-500/30", label: "Active" };
    default:
      return { text: "text-muted-foreground", bg: "bg-muted/40", border: "border-border/50", label: status };
  }
};
