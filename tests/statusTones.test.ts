import { test } from "node:test";
import assert from "node:assert/strict";
import { statusBadgeTone } from "../src/lib/statusTones";

test("approved categories read green and submitted ones read a different colour", () => {
  const approved = statusBadgeTone("approved");
  const submitted = statusBadgeTone("submitted");

  assert.ok(approved.includes("success"), `approved should be green, got ${approved}`);
  assert.ok(submitted.includes("info"), `submitted should be blue, got ${submitted}`);
  assert.notEqual(approved, submitted, "approved and submitted must not share a tone");
});

test("other checklist statuses keep their own tones", () => {
  assert.ok(statusBadgeTone("in_progress").includes("warning"));
  assert.ok(statusBadgeTone("needs_attention").includes("warning"));
  assert.ok(statusBadgeTone("rejected").includes("primary"));
  assert.ok(statusBadgeTone("completed").includes("success"));
});

test("unknown or missing status falls back to a neutral pill", () => {
  for (const status of ["not_started", "made_up", "", undefined, null]) {
    const tone = statusBadgeTone(status as string | undefined | null);
    assert.ok(tone.includes("muted"), `expected neutral tone for ${String(status)}, got ${tone}`);
  }
});
