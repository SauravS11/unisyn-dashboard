import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fundingDocumentSections, isFundingDocumentSection } from "../src/lib/fundingChecklist";

describe("Document-only funding checklists", () => {
  test("includes only the matrix's main and supporting document groups", () => {
    const sections = "ABCDEFGH".split("").map((section_code) => ({ section_code }));
    assert.deepEqual(fundingDocumentSections(sections).map((s) => s.section_code), ["G", "H"]);
  });

  test("legacy questionnaires cannot be opened as current checklist sections", () => {
    for (const code of "ABCDEF") assert.equal(isFundingDocumentSection(code), false);
    assert.equal(isFundingDocumentSection("G"), true);
    assert.equal(isFundingDocumentSection("H"), true);
  });
});