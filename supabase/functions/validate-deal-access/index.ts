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

    // Resolve deal ID (could be UUID or deal_code)
    let resolvedDealId = dealId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(dealId)) {
      // Try to find deal by deal_code
      const { data: dealByCode, error: lookupError } = await supabase
        .from("deals")
        .select("id")
        .eq("deal_code", dealId.toLowerCase())
        .maybeSingle();
      
      if (lookupError || !dealByCode) {
        return new Response(
          JSON.stringify({ valid: false, message: "Deal not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedDealId = dealByCode.id;
    }

    // Call the database function to validate access token
    const { data, error } = await supabase.rpc("validate_deal_access_token", {
      p_deal_id: resolvedDealId,
      p_access_token: accessToken,
    });

    if (error) {
      // Log error code only, not full error details
      console.error("Token validation failed:", error.code || "UNKNOWN");
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
    // Log generic error indicator, not full error details
    console.error("Token validation error occurred");
    return new Response(
      JSON.stringify({ valid: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
