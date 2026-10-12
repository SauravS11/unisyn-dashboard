export interface ChecklistCount {
  code: string;
  name?: string;
  responseTotal: number;
  responsesDone: number;
  documentTotal: number;
  documentsDone: number;
}

export type ChecklistPhase = "responses" | "documents";

function phaseCounts(counts: ChecklistCount[], phase?: ChecklistPhase): ChecklistCount[] {
  if (!phase) return counts;
  return counts.map((count) => phase === "responses"
    ? { ...count, documentTotal: 0, documentsDone: 0 }
    : { ...count, responseTotal: 0, responsesDone: 0 })
    .filter((count) => count.responseTotal + count.documentTotal > 0);
}

export function checklistMilestones(
  counts: ChecklistCount[],
  current?: { code: string; responsesDone?: number; documentsDone?: number },
  phase?: ChecklistPhase,
) {
  return phaseCounts(counts.map((count) => count.code === current?.code ? {
    ...count,
    responsesDone: current.responsesDone ?? count.responsesDone,
    documentsDone: current.documentsDone ?? count.documentsDone,
  } : count), phase).map((count) => {
    const total = count.responseTotal + count.documentTotal;
    const done = count.responsesDone + count.documentsDone;
    return { code: count.code, name: count.name ?? count.code, total, done, complete: total > 0 && done >= total };
  });
}

export function checklistProgress(
  counts: ChecklistCount[],
  current?: { code: string; responsesDone?: number; documentsDone?: number },
  averageCategories = false,
  phase?: ChecklistPhase,
) {
  const updated = phaseCounts(counts.map((count) => count.code === current?.code ? {
    ...count,
    responsesDone: current.responsesDone ?? count.responsesDone,
    documentsDone: current.documentsDone ?? count.documentsDone,
  } : count), phase);
  const total = updated.reduce((sum, count) => sum + count.responseTotal + count.documentTotal, 0);
  const done = updated.reduce((sum, count) => sum + count.responsesDone + count.documentsDone, 0);
  const completion = averageCategories
    ? (updated.length ? Math.round(updated.reduce((sum, count) => {
      const size = count.responseTotal + count.documentTotal;
      return sum + (size ? (count.responsesDone + count.documentsDone) / size : 0);
    }, 0) / updated.length * 100) : 0)
    : (total ? Math.round(done / total * 100) : 0);
  return { total, done, completion: Math.min(100, Math.max(0, completion)) };
}