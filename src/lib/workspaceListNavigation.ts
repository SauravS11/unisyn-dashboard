export const MNA_SUMMARY_LINKS = {
  pending: "/deals?tab=pending",
  awaiting: "/deals?tab=awaiting",
  active: "/deals?tab=active",
} as const;

export const FUNDING_SUMMARY_LINKS = {
  draft: "/incubator/applications?tab=draft",
  live: "/incubator/applications?tab=live",
  review: "/incubator/applications?tab=review",
  approved: "/incubator/applications?tab=approved",
} as const;

export function listTab<T extends string>(params: URLSearchParams, allowed: readonly T[], fallback: T): T {
  const requested = params.get("tab");
  return allowed.find(tab => tab === requested) ?? fallback;
}