
# Migrate from Lovable Cloud → your own Supabase project

## Important caveats (please read first)

1. **This is irreversible.** Once Lovable Cloud is disabled on this project, it cannot be re-enabled, and reverting to an older version that still used Cloud will not bring the managed backend back.
2. **There is no automated "transfer" button.** The current Cloud project is fully managed by Lovable. The migration is a manual copy: schema → data → storage files → edge functions → secrets → auth config, into a brand-new Supabase project that *you* own.
3. **Users will need to re-authenticate.** `auth.users` rows can be migrated, but Google OAuth currently goes through `lovable.auth` (Lovable's managed OAuth app). On your own Supabase you'll need to create your own Google OAuth client in Google Cloud Console and configure it in Supabase. Existing Google-signed-in users will keep working if their email matches, but the OAuth client itself must be re-set-up.
4. **External deal codes / access tokens keep working** as long as the data is migrated — they're stored in your own tables, not in Lovable infrastructure.
5. **Expect a short downtime window** during the cutover (typically 15–60 min depending on data size).

---

## What gets migrated

Everything currently in `<supabase-configuration>`:

- **Schema**: 17 tables (deals, deal_categories, deal_tasks, deal_documents, deal_specialists, deal_team_members, deal_access_tokens, passcode_attempts, notifications, dd_categories, expert_codes, expert_tasks, expert_documents, expert_task_completions, expert_access_log, expert_access_tokens) + all RLS policies + indexes
- **Database functions**: 24 SECURITY DEFINER functions (verify_deal_code, verify_expert_code, generate_expert_codes_for_deal, notification triggers, etc.)
- **Triggers**: cascading `updated_at`, notification triggers, deal code generation
- **Data**: every row in every table
- **Storage buckets**: `deal-documents` (private) + `expert-documents` (private), including all uploaded files and bucket RLS policies
- **Edge functions**: `verify-passcode`, `validate-deal-access`, `get-deal-data` (+ any others)
- **Auth users**: existing accounts in `auth.users`
- **Secrets**: `LOVABLE_API_KEY` and any others you've added (re-created in new project)

---

## Migration plan

### Phase 1 — Prepare new Supabase project (you do this)
1. Create a Supabase account at supabase.com if you don't already have one.
2. Create a new project. Pick a region close to your users. Save the project ref, anon key, service role key, DB password.
3. Create a Google OAuth client in Google Cloud Console, add Supabase's callback URL (`https://<new-ref>.supabase.co/auth/v1/callback`), and configure Google provider in Supabase Auth.

### Phase 2 — Export from Lovable Cloud (I do this)
1. Dump full schema as SQL (tables, RLS, functions, triggers, indexes, enums).
2. Dump all table data as SQL `INSERT` statements (or `COPY` for large tables).
3. Download every file from both storage buckets to a local archive.
4. Export `auth.users` rows (id, email, encrypted_password, metadata, created_at).
5. Package the edge function source from `supabase/functions/` (already in the repo).
6. List all required secrets.

### Phase 3 — Import into your Supabase (I do this with you)
1. Run schema SQL in your Supabase SQL editor (in dependency order: extensions → enums → tables → functions → triggers → policies).
2. Run data inserts.
3. Re-create both storage buckets with matching privacy + RLS policies, then upload all archived files preserving paths.
4. Insert `auth.users` rows via Supabase Admin API (so password hashes survive).
5. Deploy edge functions to the new project via the Supabase CLI.
6. Add secrets in the new project's Edge Function settings.

### Phase 4 — Repoint the app (I do this)
1. Update `.env` → new `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
2. Replace `lovable.auth` Google OAuth with `supabase.auth.signInWithOAuth({ provider: 'google' })` (since `lovable.auth` is Cloud-only).
3. Update `supabase/config.toml` `project_id`.
4. Smoke-test internal sign-in, deal creation, external 6-digit code access, document upload (both internal and external), specialist code flow, notifications.

### Phase 5 — Cutover
1. Schedule short downtime; do a final delta-sync of any new rows/files written since Phase 2.
2. Switch DNS / publish.
3. Disable Lovable Cloud on this project (irreversible).

---

## What I need from you to proceed

1. **Confirmation** you understand Cloud will be permanently disabled.
2. **A new Supabase project created** with project ref + service role key ready (you'll paste the service role key via the secrets tool — never in chat).
3. **A Google OAuth client** set up in Google Cloud Console for the new Supabase project (callback `https://<new-ref>.supabase.co/auth/v1/callback`).
4. **A maintenance window** (rough size of data: deals + documents — let me know approx file storage volume so I can estimate transfer time).

Once you confirm and have the new project ready, I'll start Phase 2.
