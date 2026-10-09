# Funding checklist correction
- [ ] Verify M&A and funding summaries open their matching list tabs and preserve selection on refresh and back navigation.
- [x] Show only Main and Supporting Documents on funding workspaces, excluding legacy questions from totals.
- [x] Keep converted funding applications visible and reopen their existing workspaces after exit.
- [x] Verify funding dashboard and application visibility rules with regression tests.
- [x] Restrict funding applicant and manager checklists to the two document groups in the supplied matrix.
- [x] Verify all seven live programme document lists against the matrix, preserving existing uploads and M&A.
- [x] Live document lists already match the matrix (87 documents); no database row correction needed. Legacy questionnaire records remain for history, excluded from current checklists and totals.
- [x] Verify code access and document screens, and run checklist-rule tests.
- [ ] Apply document-only checklist rules in the database serving the funding portal. Blocked: the connected database tools target a different database than the portal's configured client; reconnect the portal's database before applying changes.