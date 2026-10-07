import { describe, expect, test } from "bun:test";
import { fundingDocumentSections, isFundingDocumentSection } from "./fundingChecklist";

describe("Document-only funding checklists", () => {
  test("includes only the matrix's main and supporting document groups", () => {
    const sections = "ABCDEFGH".split("").map((section_code) => ({ section_code }));
    expect(fundingDocumentSections(sections).map((s) => s.section_code)).toEqual(["G", "H"]);
  });

  test("legacy questionnaires cannot be opened as current checklist sections", () => {
    for (const code of "ABCDEF") expect(isFundingDocumentSection(code)).toBe(false);
    expect(isFundingDocumentSection("G")).toBe(true);
    expect(isFundingDocumentSection("H")).toBe(true);
  });
});