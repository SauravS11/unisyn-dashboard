import { test } from "node:test";
import assert from "node:assert/strict";
import { MNA_SUMMARY_LINKS, FUNDING_SUMMARY_LINKS, listTab } from "../src/lib/workspaceListNavigation";

test("M&A Pending opens pending rather than another group", () => {
  assert.equal(MNA_SUMMARY_LINKS.pending, "/deals?tab=pending");
});
test("M&A Awaiting opens awaiting rather than pending", () => {
  assert.equal(MNA_SUMMARY_LINKS.awaiting, "/deals?tab=awaiting");
});
test("M&A Active opens active rather than pending", () => {
  assert.equal(MNA_SUMMARY_LINKS.active, "/deals?tab=active");
});
test("funding Draft opens drafts", () => {
  assert.equal(FUNDING_SUMMARY_LINKS.draft, "/incubator/applications?tab=draft");
});
test("funding In Progress opens awaiting applicants", () => {
  assert.equal(FUNDING_SUMMARY_LINKS.live, "/incubator/applications?tab=live");
});
test("funding Awaiting Review opens review", () => {
  assert.equal(FUNDING_SUMMARY_LINKS.review, "/incubator/applications?tab=review");
});
test("funding Approved opens approved", () => {
  assert.equal(FUNDING_SUMMARY_LINKS.approved, "/incubator/applications?tab=approved");
});
test("list selection respects links and falls back safely", () => {
  const allowed = ["pending", "awaiting", "active", "completed"] as const;
  assert.equal(listTab(new URLSearchParams("tab=active"), allowed, "pending"), "active");
  assert.equal(listTab(new URLSearchParams("tab=awaiting"), allowed, "pending"), "awaiting");
  assert.equal(listTab(new URLSearchParams("tab=unknown"), allowed, "pending"), "pending");
  assert.equal(listTab(new URLSearchParams(), ["draft", "live", "review", "approved"], "live"), "live");
});