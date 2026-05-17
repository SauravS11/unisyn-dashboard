import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-off migration tool. Copies storage files + auth users from THIS (old)
// Lovable Cloud project to the NEW Supabase project whose credentials live in
// NEW_SUPABASE_URL / NEW_SUPABASE_SERVICE_ROLE_KEY secrets.
// Trigger with ?phase=auth | storage | both. Idempotent.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const oldUrl = Deno.env.get("SUPABASE_URL")!;
    const oldKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const newUrl = Deno.env.get("NEW_SUPABASE_URL")!;
    const newKey = Deno.env.get("NEW_SUPABASE_SERVICE_ROLE_KEY")!;
    if (!newUrl || !newKey) {
      return new Response(JSON.stringify({ error: "NEW_SUPABASE_URL / NEW_SUPABASE_SERVICE_ROLE_KEY not set" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oldSb = createClient(oldUrl, oldKey, { auth: { persistSession: false } });
    const newSb = createClient(newUrl, newKey, { auth: { persistSession: false } });

    const url = new URL(req.url);
    const phase = url.searchParams.get("phase") ?? "both";
    const report: Record<string, unknown> = { phase };

    // ---------- AUTH USERS ----------
    if (phase === "auth" || phase === "both") {
      const users: any[] = [];
      let page = 1;
      while (true) {
        const { data, error } = await oldSb.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) throw new Error("list old users: " + error.message);
        users.push(...data.users);
        if (data.users.length < 1000) break;
        page++;
      }
      const results: any[] = [];
      for (const u of users) {
        const { error } = await newSb.auth.admin.createUser({
          email: u.email ?? undefined,
          phone: u.phone ?? undefined,
          email_confirm: !!u.email_confirmed_at,
          phone_confirm: !!u.phone_confirmed_at,
          user_metadata: u.user_metadata,
          app_metadata: u.app_metadata,
          id: u.id, // preserve UUID so all FK rows still match
        });
        results.push({ email: u.email, ok: !error, error: error?.message });
      }
      report.auth = { total: users.length, succeeded: results.filter(r => r.ok).length, failures: results.filter(r => !r.ok) };
    }

    // ---------- STORAGE ----------
    if (phase === "storage" || phase === "both") {
      const buckets = [
        { id: "deal-documents", public: false, fileSizeLimit: 52428800 },
        { id: "expert-documents", public: false },
      ];
      const bucketResults: any[] = [];
      for (const b of buckets) {
        const { error: bErr } = await newSb.storage.createBucket(b.id, {
          public: b.public, fileSizeLimit: b.fileSizeLimit,
        });
        bucketResults.push({ bucket: b.id, created: !bErr || bErr.message.includes("already exists"), error: bErr?.message });
      }

      // List every object via admin SQL (RPC not available) - use storage admin endpoint
      const objsResp = await fetch(`${oldUrl}/rest/v1/rpc/__nope__`, { headers: { apikey: oldKey } });
      // fallback: query storage.objects directly via PostgREST is blocked; use storage list API recursively
      async function listAll(bucket: string, prefix = ""): Promise<{ name: string }[]> {
        const out: { name: string }[] = [];
        let offset = 0;
        while (true) {
          const { data, error } = await oldSb.storage.from(bucket).list(prefix, { limit: 1000, offset });
          if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
          if (!data || data.length === 0) break;
          for (const item of data) {
            if (item.id === null) {
              // folder
              const sub = await listAll(bucket, prefix ? `${prefix}/${item.name}` : item.name);
              out.push(...sub);
            } else {
              out.push({ name: prefix ? `${prefix}/${item.name}` : item.name });
            }
          }
          if (data.length < 1000) break;
          offset += 1000;
        }
        return out;
      }

      const fileResults: any[] = [];
      for (const b of buckets) {
        const objs = await listAll(b.id);
        for (const o of objs) {
          const { data: blob, error: dlErr } = await oldSb.storage.from(b.id).download(o.name);
          if (dlErr || !blob) { fileResults.push({ bucket: b.id, name: o.name, ok: false, error: dlErr?.message }); continue; }
          const { error: upErr } = await newSb.storage.from(b.id).upload(o.name, blob, { upsert: true, contentType: blob.type || undefined });
          fileResults.push({ bucket: b.id, name: o.name, ok: !upErr, error: upErr?.message });
        }
      }
      report.storage = {
        buckets: bucketResults,
        total: fileResults.length,
        succeeded: fileResults.filter(r => r.ok).length,
        failures: fileResults.filter(r => !r.ok),
      };
    }

    return new Response(JSON.stringify(report, null, 2), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
