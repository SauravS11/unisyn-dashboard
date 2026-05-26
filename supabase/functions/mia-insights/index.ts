import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { intakeId, checklistData } = await req.json();
    if ((!intakeId || typeof intakeId !== "string") && !Array.isArray(checklistData)) {
      return new Response(JSON.stringify({ error: "intakeId or checklistData required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = Array.isArray(checklistData)
      ? checklistData
      : await (async () => {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );

          const [{ data: cats }, { data: reqs }, { data: resps }, { data: docs }] = await Promise.all([
            supabase.from("due_diligence_categories").select("id, category_code, category_name"),
            supabase.from("due_diligence_requirements").select("id, category_id, requirement_code, requirement_text, input_type, is_required"),
            supabase.from("client_requirement_responses").select("requirement_id, category_id, response_value, yes_no_value, applicable_status, comment, status").eq("client_intake_id", intakeId),
            supabase.from("client_requirement_documents").select("requirement_id, category_id, file_name, status, rejection_reason").eq("client_intake_id", intakeId),
          ]);

          const catMap: Record<string, any> = {};
          (cats ?? []).forEach((c: any) => { catMap[c.id] = c; });

          return (reqs ?? []).map((r: any) => {
            const resp = (resps ?? []).find((x: any) => x.requirement_id === r.id);
            const reqDocs = (docs ?? []).filter((d: any) => d.requirement_id === r.id);
            return {
              category: catMap[r.category_id]?.category_code + " " + (catMap[r.category_id]?.category_name ?? ""),
              requirement: r.requirement_text,
              input_type: r.input_type,
              is_required: r.is_required,
              response: resp ? { value: resp.response_value, yes_no: resp.yes_no_value, applicable: resp.applicable_status, comment: resp.comment, status: resp.status } : null,
              documents: reqDocs.map((d: any) => ({ name: d.file_name, status: d.status, rejection_reason: d.rejection_reason })),
            };
          });
        })();

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are MIA, an M&A due diligence assistant. Analyze the following due diligence checklist with the respondent's answers and uploaded documents. Produce concise, actionable insights for the advisor.

Return ONLY valid JSON with this shape:
{
  "missing_info": [ { "category": "string (e.g. 'A Corporate')", "issue": "short description of what's missing or incomplete" } ],
  "risks": [ { "category": "string", "risk": "short risk note (red flags, inconsistencies, rejected docs, suspicious answers)" } ]
}

Limit each array to the 5 most important items. Be specific and reference the requirement when possible. If nothing is wrong, return empty arrays.

Checklist data:
${JSON.stringify(summary).slice(0, 60000)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are MIA, an M&A due diligence analyst. Always respond with valid JSON only, no markdown." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResp.ok) {
      const txt = await aiResp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", status: aiResp.status, detail: txt }), {
        status: aiResp.status === 429 || aiResp.status === 402 ? aiResp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = { missing_info: [], risks: [] };
    try { parsed = JSON.parse(content); } catch { /* keep defaults */ }

    return new Response(JSON.stringify({
      missing_info: Array.isArray(parsed.missing_info) ? parsed.missing_info : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
