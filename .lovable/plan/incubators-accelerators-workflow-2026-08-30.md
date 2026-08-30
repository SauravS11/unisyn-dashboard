# Incubators & Accelerators Workflow

Add a second, fully separate workflow to UniSyn for incubators, accelerators and funding programmes. The existing M&A / Deals flow stays exactly as it is — nothing is renamed, removed or reused.

## What gets built

**Workflow choice at the door**
- Sign-up asks: "M&A / Deals" or "Incubators & Accelerators", saved on the user profile.
- Sign-in routes to the matching welcome screen; if no choice is saved yet, the selector appears first.
- Client Access detects the code: incubator prefixes (BUSFIN, PROPFIN, PROPJV, ASSET, SHORT, BASADI, YOUTH) open the applicant portal, everything else keeps going to the existing M&A portal. No sign-up, password or OTP for applicants — secure link + application code only.

**Programme manager side (new `/incubator/...` pages)**
1. Welcome screen — "Onboard an Applicant" / "View Applications", with pending / awaiting review / active programmes / clarifications stats.
2. Step 1 — select one of the 7 funding workflows (Business Finance, Property Finance, Property Joint Venture Fund, Asset Finance, Short-Term Finance, Basadi-Women Growth Fund, SME Youth Jobs Fund), each with description, section count and requirement preview.
3. Step 2 — Applicant Intake Profile: structured form with the common fields plus the SA dropdowns (applicant type, province, city/region, industry, business stage) and the funding-specific fields. No uploads on this page. Save Draft / Save to Pending / Continue.
4. Step 3 — Generated Checklist Preview: summary card (programme, applicant, application code `PREFIX-2026-####`, totals, access type) and the 7 section cards for the selected workflow only.
5. Step 4 — Send secure application request (link + application code).
6. Applications list with Pending / Awaiting Review / Active / Completed stages, styled like the existing deals list.
7. Programme Manager Review dashboard: completion, open requirements, pending review, clarifications, documents uploaded, days until due — plus the section review modal with Approve Section, Request Clarification, Request Upload, Mark as Reviewed, and document approve/deny with comment and versioning.

**Applicant portal**
- Home with progress and section index, then guided section completion: questions plus document uploads per requirement (response only, document only, or hybrid).
- Clarifications from the programme manager appear inline with the ability to answer or re-upload a new version.

**Language and features**
- Incubator side uses application / applicant / programme / requirement / clarification language only — no deal, seller, due diligence, buyer or data room wording.
- No MIA and no specialists anywhere in the incubator flow; those areas become normal programme manager review panels.

**Design**
- Same UniSyn visual system as today: glass surfaces, ambient light backgrounds, Space Grotesk + Inter, red/coral accent, green for approvals. The incubator pages get their own layout rhythm so they don't read as the deal dashboard.

## Backend

New tables, separate from the M&A tables: `funding_workflows`, `funding_workflow_sections`, `funding_workflow_requirements`, `applicant_profiles`, `applications`, `application_sections`, `application_responses`, `application_documents`, `application_reviews`, `application_clarifications`, `application_activity`, plus `workflow_type` on the user profile. All seven workflows, their 7 sections each and every requirement in the brief are seeded. RLS + grants on every table; applicant access via secure code through an edge function (same pattern as today's deal code access). Documents go to storage with versioning. Completion percentages recalculated by trigger, and realtime enabled so the manager dashboard and applicant portal update live.

## Delivery order

Because this is a large build I'll ship it in reviewable phases:
1. Database + seeds + workflow_type routing and auth selector.
2. Programme manager onboarding steps 1-4 and the applications list.
3. Applicant portal (home + section completion + uploads).
4. Review dashboard, section review modal, clarifications, approvals, realtime.
