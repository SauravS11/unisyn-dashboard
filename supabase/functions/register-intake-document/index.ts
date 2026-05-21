import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const {
      intakeId,
      accessToken,
      requirementId,
      fileName,
      fileUrl,
      fileType = null,
      fileSize = null,
      uploadComment = null,
      uploadedByEmail = null,
    } = body ?? {};

    if (!intakeId || !accessToken || !requirementId || !fileName || !fileUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("register_intake_document", {
      p_intake_id: intakeId,
      p_token: accessToken,
      p_requirement_id: requirementId,
      p_file_name: fileName,
      p_file_url: fileUrl,
      p_file_type: fileType,
      p_file_size: fileSize,
      p_upload_comment: uploadComment,
      p_uploaded_by_email: uploadedByEmail,
    });

    if (error) {
      console.error("register_intake_document error", error.message);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
