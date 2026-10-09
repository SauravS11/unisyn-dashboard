// Keep legacy questionnaire records for history, but exclude them from current checklists.
export const FUNDING_DOCUMENT_SECTIONS = ["G", "H"] as const;

export function isFundingDocumentSection(code: string): boolean {
  return FUNDING_DOCUMENT_SECTIONS.some((section) => section === code);
}

export function fundingDocumentSections<T extends { section_code: string }>(sections: T[]): T[] {
  return sections.filter((section) => isFundingDocumentSection(section.section_code));
}

export function isFundingWorkspace(
  deal: { client_type?: string | null },
  categories: { category_code: string; title: string }[],
): boolean {
  return deal.client_type === "funding" || categories.some(
    (category) => category.category_code === "G" && category.title === "Main Documents",
  );
}

export function workspaceCategories<T extends { category_code: string; title: string }>(
  categories: T[],
  funding: boolean,
): T[] {
  if (!funding) return categories;
  return categories
    .filter((category) => isFundingDocumentSection(category.category_code))
    .map((category) => ({
      ...category,
      title: category.category_code === "G" ? "Main Documents" : "Supporting Documents",
    }));
}