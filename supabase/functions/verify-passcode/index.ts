import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyPasscodeRequest {
  dealId: string;
  passcode: string;
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

    // Get client IP from headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";

    // Parse request body
    const { dealId, passcode }: VerifyPasscodeRequest = await req.json();

    // Validate input
    if (!dealId || typeof dealId !== "string") {
      return new Response(
        JSON.stringify({ success: false, message: "Deal ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!passcode || typeof passcode !== "string" || passcode.length !== 6) {
      return new Response(
        JSON.stringify({ success: false, message: "Valid 6-digit passcode is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to parse as UUID - if not valid UUID format, return helpful error
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(dealId)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid deal ID. Please enter the full deal ID (e.g., b5504160-eba2-4a39-8de8-f8910f5b02c9)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call the database function to verify passcode with rate limiting
    const { data, error } = await supabase.rpc("verify_deal_passcode", {
      p_deal_id: dealId,
      p_passcode: passcode,
      p_ip_address: clientIp,
    });

    if (error) {
      // Log error code only, not full error details
      console.error("Passcode verification failed:", error.code || "UNKNOWN");
      return new Response(
        JSON.stringify({ success: false, message: "Verification failed. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data?.[0];

    if (!result || !result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: result?.message || "Invalid passcode" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success with access token
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access granted",
        accessToken: result.access_token,
        dealId: dealId 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    // Log generic error indicator, not full error details
    console.error("Passcode verification error occurred");
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
