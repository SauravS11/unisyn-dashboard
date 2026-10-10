import { test } from "node:test";
import assert from "node:assert/strict";
import { checklistProgress, checklistMilestones } from "../src/lib/checklistProgress";

test("overall checklist includes unfilled document requirements alongside responses", () => {
  const counts = [{ code: "A", responseTotal: 2, responsesDone: 2, documentTotal: 2, documentsDone: 0 }];
  assert.deepEqual(checklistProgress(counts, undefined, true), { done: 2, total: 4, completion: 50 });
  assert.deepEqual(checklistProgress(counts, { code: "A", documentsDone: 2 }, true), { done: 4, total: 4, completion: 100 });
});

test("funding overall includes main and supporting documents after an upload", () => {
  const counts = [
    { code: "G", responseTotal: 0, responsesDone: 0, documentTotal: 2, documentsDone: 1 },
    { code: "H", responseTotal: 0, responsesDone: 0, documentTotal: 6, documentsDone: 2 },
  ];
  assert.deepEqual(checklistProgress(counts, { code: "G", documentsDone: 2 }), { done: 4, total: 8, completion: 50 });
});

test("seller overall preserves the overview's category-averaged calculation", () => {
  const counts = [
    { code: "A", responseTotal: 1, responsesDone: 1, documentTotal: 0, documentsDone: 0 },
    { code: "B", responseTotal: 3, responsesDone: 0, documentTotal: 0, documentsDone: 0 },
  ];
  assert.equal(checklistProgress(counts, undefined, true).completion, 50);
});

test("category milestones complete only after both answers and documents are done", () => {
  const counts = [{ code: "A", name: "Historical Financials", responseTotal: 2, responsesDone: 2, documentTotal: 1, documentsDone: 0 }];
  assert.equal(checklistMilestones(counts)[0].complete, false);
  assert.equal(checklistMilestones(counts, { code: "A", documentsDone: 1 })[0].complete, true);
});

test("funding milestones independently track main and supporting documents", () => {
  const counts = [
    { code: "G", name: "Main Documents", responseTotal: 0, responsesDone: 0, documentTotal: 2, documentsDone: 2 },
    { code: "H", name: "Supporting Documents", responseTotal: 0, responsesDone: 0, documentTotal: 6, documentsDone: 5 },
  ];
  assert.deepEqual(checklistMilestones(counts).map((m) => m.complete), [true, false]);
  assert.deepEqual(checklistMilestones(counts, { code: "H", documentsDone: 6 }).map((m) => m.complete), [true, true]);
});

test("empty categories do not show a completed milestone", () => {
  assert.equal(checklistMilestones([{ code: "A", responseTotal: 0, responsesDone: 0, documentTotal: 0, documentsDone: 0 }])[0].complete, false);
});