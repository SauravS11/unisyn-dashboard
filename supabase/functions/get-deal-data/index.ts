import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetDealDataRequest {
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
    const { dealId, accessToken }: GetDealDataRequest = await req.json();

    // Validate input
    if (!dealId || typeof dealId !== "string") {
      return new Response(
        JSON.stringify({ success: false, message: "Deal ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!accessToken || typeof accessToken !== "string") {
      return new Response(
        JSON.stringify({ success: false, message: "Access token is required" }),
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
          JSON.stringify({ success: false, message: "Deal not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      resolvedDealId = dealByCode.id;
    }

    // Validate access token first
    const { data: isValid, error: validationError } = await supabase.rpc("validate_deal_access_token", {
      p_deal_id: resolvedDealId,
      p_access_token: accessToken,
    });

    if (validationError || !isValid) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid or expired access token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch deal data (excluding sensitive fields like passcode)
    const { data: dealData, error: dealError } = await supabase
      .from("deals")
      .select("id, name, deal_code, target_close_date, status, buyer_name, seller_name, created_at, updated_at")
      .eq("id", resolvedDealId)
      .single();

    if (dealError || !dealData) {
      return new Response(
        JSON.stringify({ success: false, message: "Deal not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("deal_categories")
      .select("id, title, category_code, category_order")
      .eq("deal_id", resolvedDealId)
      .order("category_order");

    if (categoriesError) {
      console.error("Categories fetch failed:", categoriesError.code || "UNKNOWN");
    }

    // Fetch tasks
    const categoryIds = (categoriesData || []).map((cat: any) => cat.id);
    const { data: tasksData, error: tasksError } = await supabase
      .from("deal_tasks")
      .select("*")
      .in("category_id", categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"])
      .order("task_order");

    if (tasksError) {
      console.error("Tasks fetch failed:", tasksError.code || "UNKNOWN");
    }

    // Fetch specialists
    const { data: specialistsData, error: specialistsError } = await supabase
      .from("deal_specialists")
      .select("*")
      .in("category_id", categoryIds.length > 0 ? categoryIds : ["00000000-0000-0000-0000-000000000000"]);

    if (specialistsError) {
      console.error("Specialists fetch failed:", specialistsError.code || "UNKNOWN");
    }

    // Fetch documents count (excluding sensitive metadata)
    const { count: documentsCount, error: docsError } = await supabase
      .from("deal_documents")
      .select("*", { count: "exact", head: true })
      .eq("deal_id", resolvedDealId);

    if (docsError) {
      console.error("Documents count fetch failed:", docsError.code || "UNKNOWN");
    }

    // Fetch core team members (excluding sensitive fields)
    const { data: coreTeamData, error: coreTeamError } = await supabase
      .from("deal_team_members")
      .select("id, full_name, email, role, contact_number, permission_level")
      .eq("deal_id", resolvedDealId);

    if (coreTeamError) {
      console.error("Core team fetch failed:", coreTeamError.code || "UNKNOWN");
    }

    return new Response(
      JSON.stringify({
        success: true,
        deal: dealData,
        categories: categoriesData || [],
        tasks: tasksData || [],
        specialists: specialistsData || [],
        documentsCount: documentsCount || 0,
        coreTeam: coreTeamData || [],
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    // Log generic error indicator, not full error details
    console.error("Deal data fetch error occurred");
    return new Response(
      JSON.stringify({ success: false, message: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
