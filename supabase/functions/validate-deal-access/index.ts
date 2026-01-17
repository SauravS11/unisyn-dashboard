import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateAccessRequest {
  dealId: string;
  accessToken: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create Supabase client with service role (to bypass RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { dealId, accessToken }: ValidateAccessRequest = await req.json();

    // Validate input
    if (!dealId || typeof dealId !== "string") {
      return new Response(
        JSON.stringify({ valid: false, message: "Deal ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accessToken || typeof accessToken !== "string") {
      return new Response(
        JSON.stringify({ valid: false, message: "Access token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate dealId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealId)) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid deal ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the database function to validate access token
    const { data, error } = await supabase.rpc("validate_deal_access_token", {
      p_deal_id: dealId,
      p_access_token: accessToken,
    });

    if (error) {
      console.error("Error validating access token:", error);
      return new Response(
        JSON.stringify({ valid: false, message: "Validation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, message: "Invalid or expired access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, message: "Access token is valid" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ valid: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
