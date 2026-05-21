import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim().length < 4) {
      return new Response(JSON.stringify({ success: false, message: "Invalid code." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const ip = req.headers.get("x-forwarded-for") ?? "unknown";
    const ua = req.headers.get("user-agent") ?? null;

    const { data, error } = await supabase.rpc("verify_intake_code", {
      p_code: code.trim(),
      p_ip: ip,
      p_user_agent: ua,
    });

    if (error) {
      console.error("verify_intake_code error", error.message);
      return new Response(JSON.stringify({ success: false, message: "Verification failed." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.success) {
      return new Response(
        JSON.stringify({ success: false, message: row?.message ?? "Invalid code." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: row.access_token,
        intakeId: row.intake_id,
        intakeCode: row.intake_code,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("verify-intake-code exception", (e as Error).message);
    return new Response(JSON.stringify({ success: false, message: "Server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
