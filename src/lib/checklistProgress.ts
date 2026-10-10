export interface ChecklistCount {
  code: string;
  responseTotal: number;
  responsesDone: number;
  documentTotal: number;
  documentsDone: number;
}

export function checklistProgress(
  counts: ChecklistCount[],
  current?: { code: string; responsesDone?: number; documentsDone?: number },
  averageCategories = false,
) {
  const updated = counts.map((count) => count.code === current?.code ? {
    ...count,
    responsesDone: current.responsesDone ?? count.responsesDone,
    documentsDone: current.documentsDone ?? count.documentsDone,
  } : count);
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