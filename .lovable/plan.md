
# UniSyn MVP Pivot: Client Onboarding → Review → Deal

This is a large, multi-phase change. I'll break it into shippable phases so you can review as we go.

## Scope summary
- Restructure the **Welcome page** around two cards: *Onboard a Client* and *View Deals*.
- Build the full **advisor onboarding flow** (Client Intake Profile → Select A–N Categories → Send Secure Request → Review → Approve → Create Deal Workspace).
- Build a **lightweight respondent portal** (deal-code only, no auth/OTP/signup, no sidebar), with each category split into **Part 1: Responses & Confirmations** and **Part 2: Documents & Supporting Evidence**.
- **Database**: new tables for client intakes, A–N categories, requirements, responses, documents, advisor comments, activity log. Update `deals` to link to source intake.
- **Pending Client Intakes** section on the deals list.
- **MIA placeholder** panels for later AI wiring.

## Phased delivery

### Phase 1 — Database foundation (this turn, after you approve)
Create / update tables:
- `client_intakes` (with `intake_code`, `secure_link_token`, status enum, `converted_deal_id`)
- `due_diligence_categories` (seed A–N per your new list, replacing the old A–N labels where they differ — F becomes "Material Contracts, Negotiations and Arrangements", new K=Legal, L=Technology, M=Others, N=Additional Information)
- `due_diligence_requirements` (with `input_type` enum: written_response | yes_no | applicable_na | document_upload | document_upload_with_comment) — seeded per your spec
- `client_intake_categories`
- `client_requirement_responses`
- `client_requirement_documents`
- `advisor_review_comments`
- `intake_activity_log`
- ALTER `deals` ADD `source_intake_id`, `client_company_name`, `client_type`, `intake_approved_at` (deal_code already exists)
- RLS: advisor-side keyed to `auth.uid()`; respondent-side via a SECURITY DEFINER RPC + token (mirrors the existing deal-code pattern)
- Edge function `verify-intake-code` returning a short-lived access token, plus `submit-intake-response` / `upload-intake-document` for respondent writes

### Phase 2 — Welcome page redesign
- New `Welcome` with two large cards: **Onboard a Client** (primary CTA → `/onboarding/new`) and **View Deals** (→ `/deals`).
- Keep logo, sign-out, theme toggle, subtitle.
- Lower widgets (Recent Activity, Pending Intakes count, Deals Awaiting Review) populated from new tables.

### Phase 3 — Advisor onboarding flow
Routes:
- `/onboarding/new` — Client Intake Profile form (all fields you listed, Save Draft / Continue).
- `/onboarding/:intakeId/categories` — A–N selection with requirement counts and per-category advisor notes.
- `/onboarding/:intakeId/send` — generates `USYN-YYYY-NNNN` code + secure link, email preview, recipient, due date, custom message, Send Request.
- `/onboarding/:intakeId/review` — advisor review page: per-category status, completion %, missing items, comments, request clarification / re-upload, approve category, approve intake. Approve-all unlocks **Create Deal Workspace** which inserts into `deals` and redirects to existing deal dashboard.

### Phase 4 — Respondent portal (no auth)
Routes (separate layout, no sidebar):
- `/respond` — enter Deal Code → calls `verify-intake-code` → stores token in sessionStorage.
- `/respond/:intakeId` — Respondent Dashboard (deal name, code, due date, per-category cards with Part 1 % / Part 2 % / status / Open Category).
- `/respond/:intakeId/category/:categoryCode/part-1` — Responses & Confirmations (written / yes-no / applicable-na inputs only).
- `/respond/:intakeId/category/:categoryCode/part-2` — Documents & Supporting Evidence (upload + optional comment per requirement).
- Submit Category transitions status to `submitted`.

### Phase 5 — Deals list updates
- Existing `/deals` gains a **Pending Client Intakes** section with intake statuses and "Continue" / "Review" / "Resend" actions.
- Active deals table gains filters you listed (status, risk, category, owner, last updated).

### Phase 6 — MIA placeholders
- Empty-state panels with "MIA insights coming soon" on advisor review and deal dashboard. Structured so a future edge function can populate them.

## Technical notes (for the record)
- Respondent portal will use the same SECURITY DEFINER + sha256 token pattern already used by `verify-passcode` / `deal_access_tokens`. RLS on respondent-writable tables denies public access; all writes go through edge functions that validate the token.
- Progress % computed in a SQL view / function so both advisor and respondent see the same numbers.
- All new code uses the existing `@/integrations/supabase/customClient` (your new Supabase project), consistent with the recent migration.
- Seeded requirements come straight from section 6 of your brief; we can refine wording later without schema changes.

## What I need from you before starting
1. **Confirm I should run the Phase 1 migration now** against your new Supabase project (`cewlianjjbqkxopqpirb`). This is additive — existing `deals`, `deal_categories`, `deal_tasks`, etc. are untouched except for the new columns on `deals`.
2. **Old A–N data**: the existing `dd_categories` / `deal_categories` use a slightly different A–N list (e.g. F = "Material Contracts", K = "Customer & Revenue"). The new A–N list in your brief is the source of truth going forward. OK to keep the old tables for existing deals and use the **new** `due_diligence_categories` table only for intakes? (Cleanest, no breakage.)
3. **Email sending**: do you want me to actually send the secure-request email via Resend (you'd add a `RESEND_API_KEY` secret), or just show the preview + copyable link for now?

Once you answer those three, I'll execute Phase 1 (migration) immediately and then proceed phase by phase.
