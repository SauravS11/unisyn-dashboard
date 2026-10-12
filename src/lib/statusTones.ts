// Shared status badge colours for checklist lists (seller/buyer categories and
// funding application sections), so "Approved" always reads green and
// "Submitted" always reads blue on both sides.
//
// Tones reuse the same semantic tokens as STATUS_CARD_TONES (StatusTabBar):
// red = attention/rejected, amber = in progress, blue = submitted/under review,
// green = approved/complete.

const MUTED = "bg-muted/40 text-muted-foreground border-border/50 hover:bg-muted/40";

export const STATUS_BADGE_TONES: Record<string, string> = {
  not_started: MUTED,
  in_progress: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15",
  needs_attention: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15",
  clarification_requested: "bg-warning/15 text-warning border-warning/30 hover:bg-warning/15",
  submitted: "bg-info/15 text-info-foreground border-info/30 hover:bg-info/15",
  submitted_for_review: "bg-info/15 text-info-foreground border-info/30 hover:bg-info/15",
  in_review: "bg-info/15 text-info-foreground border-info/30 hover:bg-info/15",
  approved: "bg-success/15 text-success border-success/30 hover:bg-success/15",
  completed: "bg-success/15 text-success border-success/30 hover:bg-success/15",
  rejected: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/15",
  denied: "bg-primary/15 text-primary border-primary/30 hover:bg-primary/15",
};

/** Badge classes for a checklist status slug; falls back to a neutral pill. */
export const statusBadgeTone = (status?: string | null) =>
  STATUS_BADGE_TONES[status ?? ""] ?? MUTED;
