import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { fundingDocumentSections, isFundingDocumentSection, isFundingWorkspace, workspaceCategories } from "../src/lib/fundingChecklist";
import { APPROVED_APPLICATION_STATUSES } from "../src/lib/fundingWorkflows";

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

  test("funding dashboards contain two document categories and count only their tasks", () => {
    const categories = "ABCDEFGH".split("").map(category_code => ({ category_code, title: "Legacy", tasks: [{ checked: true }, { checked: false }] }));
    const current = workspaceCategories(categories, true);
    assert.deepEqual(current.map(category => category.category_code), ["G", "H"]);
    assert.equal(current.flatMap(category => category.tasks).length, 4);
    assert.equal(current.flatMap(category => category.tasks).filter(task => task.checked).length, 2);
  });

  test("M&A categories and checklist totals stay unchanged", () => {
    const categories = "ABCDEFGHIJKLMN".split("").map(category_code => ({ category_code, title: "M&A", tasks: [1] }));
    assert.equal(isFundingWorkspace({ client_type: "seller" }, categories), false);
    assert.deepEqual(workspaceCategories(categories, false), categories);
    assert.equal(workspaceCategories(categories, false).flatMap(category => category.tasks).length, 14);
  });

  test("older external funding dashboards can be identified by their document category", () => {
    assert.equal(isFundingWorkspace({}, [{ category_code: "G", title: "Main Documents" }]), true);
    assert.equal(isFundingWorkspace({ client_type: "funding" }, []), true);
  });

  test("converted funding applications remain in the approved group after workspace creation", () => {
    assert.equal(APPROVED_APPLICATION_STATUSES.includes("converted_to_deal"), true);
    assert.equal(APPROVED_APPLICATION_STATUSES.includes("approved"), true);
    assert.equal(APPROVED_APPLICATION_STATUSES.includes("draft"), false);
  });
});