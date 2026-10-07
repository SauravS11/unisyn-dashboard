// Keep legacy questionnaire records for history, but exclude them from current checklists.
export const FUNDING_DOCUMENT_SECTIONS = ["G", "H"] as const;

export function isFundingDocumentSection(code: string): boolean {
  return FUNDING_DOCUMENT_SECTIONS.some((section) => section === code);
}

export function fundingDocumentSections<T extends { section_code: string }>(sections: T[]): T[] {
  return sections.filter((section) => isFundingDocumentSection(section.section_code));
}