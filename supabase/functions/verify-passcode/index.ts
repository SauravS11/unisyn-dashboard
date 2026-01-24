import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyDealCodeRequest {
  dealCode: string;
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
    const { dealCode }: VerifyDealCodeRequest = await req.json();

    // Validate input - must be exactly 6 digits
    if (!dealCode || typeof dealCode !== "string" || !/^\d{6}$/.test(dealCode)) {
      return new Response(
        JSON.stringify({ success: false, message: "Valid 6-digit deal code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying deal code:", dealCode);

    // Call the new database function to verify deal code
    const { data, error } = await supabase.rpc("verify_deal_code", {
      p_deal_code: dealCode,
      p_ip_address: clientIp,
    });

    if (error) {
      console.error("Deal code verification failed:", error.code || "UNKNOWN", error.message);
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
          message: result?.message || "Invalid deal code" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success with access token and the actual deal UUID
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Access granted",
        accessToken: result.access_token,
        dealId: result.deal_uuid
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Deal code verification error occurred:", err);
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});