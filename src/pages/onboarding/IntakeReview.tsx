import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, MessageSquare, Rocket } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MiaInsights } from "@/components/MiaInsights";

interface CatRow {
  id: string;
  category_id: string;
  status: string;
  category_code: string;
  category_name: string;
  total: number;
  responses: number;
  documents: number;
}

export default function IntakeReview() {
  const { intakeId } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake] = useState<any>(null);
  const [rows, setRows] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: i }, { data: cats }, { data: reqs }, { data: resps }, { data: docs }] = await Promise.all([
      (supabase as any).from("client_intakes").select("*").eq("id", intakeId).single(),
      (supabase as any).from("client_intake_categories").select("id, category_id, status, advisor_notes").eq("client_intake_id", intakeId),
      (supabase as any).from("due_diligence_requirements").select("id, category_id, input_type"),
      (supabase as any).from("client_requirement_responses").select("requirement_id, category_id, status").eq("client_intake_id", intakeId),
      (supabase as any).from("client_requirement_documents").select("requirement_id, category_id").eq("client_intake_id", intakeId),
    ]);
    const { data: allCats } = await (supabase as any)
      .from("due_diligence_categories")
      .select("id, category_code, category_name");
    const catMap: Record<string, any> = {};
    (allCats ?? []).forEach((c: any) => { catMap[c.id] = c; });

    const reqByCat: Record<string, string[]> = {};
    (reqs ?? []).forEach((r: any) => {
      reqByCat[r.category_id] ??= [];
      reqByCat[r.category_id].push(r.id);
    });

    const result: CatRow[] = (cats ?? []).map((c: any) => {
      const total = reqByCat[c.category_id]?.length ?? 0;
      const rCount = (resps ?? []).filter((r: any) => r.category_id === c.category_id).length;
      const dCount = (docs ?? []).filter((d: any) => d.category_id === c.category_id).length;
      return {
        id: c.id,
        category_id: c.category_id,
        status: c.status,
        category_code: catMap[c.category_id]?.category_code ?? "",
        category_name: catMap[c.category_id]?.category_name ?? "",
        total,
        responses: rCount,
        documents: dCount,
      };
    }).sort((a, b) => a.category_code.localeCompare(b.category_code));

    setIntake(i);
    setRows(result);
    setLoading(false);
  };

  useEffect(() => { load(); }, [intakeId]);

  const overall = useMemo(() => {
    if (rows.length === 0) return 0;
    const sum = rows.reduce((acc, r) => acc + (r.total ? (r.responses + r.documents) / r.total : 0), 0);
    return Math.min(100, Math.round((sum / rows.length) * 100));
  }, [rows]);

  const approveCategory = async (id: string) => {
    setBusy(true);
    try {
      await (supabase as any).from("client_intake_categories").update({ status: "approved" }).eq("id", id);
      toast.success("Category approved");
      load();
    } finally { setBusy(false); }
  };

  const requestClarification = async (categoryId: string) => {
    const comment = prompt("What clarification do you need from the respondent?");
    if (!comment) return;
    const { data: userData } = await supabase.auth.getUser();
    await (supabase as any).from("advisor_review_comments").insert({
      client_intake_id: intakeId,
      category_id: categoryId,
      comment_text: comment,
      comment_type: "clarification_request",
      created_by: userData?.user?.id,
    });
    await (supabase as any).from("client_intake_categories").update({ status: "changes_requested" }).eq("client_intake_id", intakeId).eq("category_id", categoryId);
    toast.success("Clarification requested");
    load();
  };

  const allApproved = rows.length > 0 && rows.every((r) => r.status === "approved");

  const approveIntake = async () => {
    setBusy(true);
    try {
      await (supabase as any).from("client_intakes").update({
        status: "approved",
        intake_approved_at: new Date().toISOString(),
      }).eq("id", intakeId);
      toast.success("Intake approved");
      load();
    } finally { setBusy(false); }
  };

  const createDeal = async () => {
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: deal, error } = await (supabase as any).from("deals").insert({
        name: intake.company_name,
        user_id: userData?.user?.id,
        status: "active",
        target_close_date: intake.due_date,
        source_intake_id: intakeId,
        client_company_name: intake.company_name,
        client_type: intake.client_type,
        intake_approved_at: intake.intake_approved_at,
        industry: intake.industry,
      }).select("id").single();
      if (error) throw error;
      await (supabase as any).from("client_intakes").update({
        status: "converted_to_deal",
        converted_deal_id: deal.id,
      }).eq("id", intakeId);
      toast.success("Deal workspace created");
      navigate(`/deals/${deal.id}/dashboard`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  if (loading || !intake) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-10 px-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/welcome")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold">{intake.company_name}</CardTitle>
                    <CardDescription>
                      <span className="font-mono text-primary">{intake.intake_code}</span> · {intake.client_type} · Status: {intake.status.replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <Badge variant={intake.status === "approved" ? "default" : "secondary"}>{intake.status.replace(/_/g, " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Progress value={overall} className="h-2 flex-1" />
                  <span className="text-sm font-semibold tabular-nums">{overall}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Overall completion across selected categories</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">No categories selected.</p>}
                {rows.map((r) => {
                  const pct = r.total ? Math.round(((r.responses + r.documents) / r.total) * 100) : 0;
                  const missing = Math.max(0, r.total - r.responses - r.documents);
                  return (
                    <div key={r.id} className="rounded-lg border border-border/50 bg-card/40 p-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-bold text-destructive">{r.category_code}</span>
                          <h3 className="font-semibold">{r.category_name}</h3>
                        </div>
                        <Badge variant={r.status === "approved" ? "default" : r.status === "changes_requested" ? "destructive" : "secondary"}>
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs tabular-nums">{pct}%</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>{r.responses} responses</span>
                        <span>{r.documents} documents</span>
                        <span className={missing > 0 ? "text-destructive" : ""}>{missing} missing</span>
                      </div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => requestClarification(r.category_id)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Request clarification
                        </Button>
                        <Button size="sm" className="gap-1" disabled={busy || r.status === "approved"} onClick={() => approveCategory(r.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve category
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
              <CardHeader><CardTitle className="text-lg">Next Steps</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {intake.status !== "approved" && intake.status !== "converted_to_deal" && (
                  <Button className="w-full gap-2" disabled={!allApproved || busy} onClick={approveIntake}>
                    <CheckCircle2 className="h-4 w-4" /> Approve Full Intake
                  </Button>
                )}
                {intake.status === "approved" && (
                  <Button className="w-full gap-2" disabled={busy} onClick={createDeal}>
                    <Rocket className="h-4 w-4" /> Create Deal Workspace
                  </Button>
                )}
                {intake.status === "converted_to_deal" && intake.converted_deal_id && (
                  <Button className="w-full gap-2" variant="outline" onClick={() => navigate(`/deals/${intake.converted_deal_id}/dashboard`)}>
                    Open Deal Dashboard
                  </Button>
                )}
                {!allApproved && intake.status !== "converted_to_deal" && (
                  <p className="text-xs text-muted-foreground">All categories must be approved before creating a deal.</p>
                )}
              </CardContent>
            </Card>
            <MiaInsights />
          </div>
        </div>
      </div>
    </div>
  );
}
