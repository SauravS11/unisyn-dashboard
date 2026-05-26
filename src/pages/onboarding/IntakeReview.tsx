import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, MessageSquare, Rocket, FileText,
  ExternalLink, ThumbsUp, ThumbsDown, Eye, RefreshCw, ShieldCheck,
  AlertCircle, FolderOpen, Mail, XCircle, Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MiaInsights } from "@/components/MiaInsights";
import { GlassIcon } from "@/components/ui/glass-icon";
import { PageShell } from "@/components/ui/page-shell";

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
  const [reviewCat, setReviewCat] = useState<CatRow | null>(null);
  const [reviewData, setReviewData] = useState<{ requirements: any[]; responses: any[]; documents: any[] } | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [denyDoc, setDenyDoc] = useState<any | null>(null);
  const [denyReason, setDenyReason] = useState("");
  const [denyBusy, setDenyBusy] = useState(false);

  const openReview = async (row: CatRow) => {
    setReviewCat(row);
    setReviewData(null);
    setReviewLoading(true);
    try {
      const [{ data: reqs }, { data: resps }, { data: docs }] = await Promise.all([
        (supabase as any).from("due_diligence_requirements")
          .select("id, requirement_code, requirement_text, input_type, display_order")
          .eq("category_id", row.category_id).eq("is_active", true).order("display_order"),
        (supabase as any).from("client_requirement_responses")
          .select("requirement_id, response_value, yes_no_value, applicable_status, comment, status")
          .eq("client_intake_id", intakeId).eq("category_id", row.category_id),
        (supabase as any).from("client_requirement_documents")
          .select("id, requirement_id, file_name, file_url, file_type, upload_comment, uploaded_by_email, status, uploaded_at, version, rejection_reason, replaces_document_id")
          .eq("client_intake_id", intakeId).eq("category_id", row.category_id)
          .order("uploaded_at", { ascending: false }),
      ]);
      setReviewData({ requirements: reqs ?? [], responses: resps ?? [], documents: docs ?? [] });
    } finally {
      setReviewLoading(false);
    }
  };

  const approveDoc = async (docId: string) => {
    const { error } = await (supabase as any).from("client_requirement_documents")
      .update({ status: "approved", rejection_reason: null, updated_at: new Date().toISOString() }).eq("id", docId);
    if (error) { toast.error(error.message); return; }
    toast.success("Document approved");
    if (reviewCat) openReview(reviewCat);
    load();
  };

  const confirmDeny = async () => {
    if (!denyDoc) return;
    if (!denyReason.trim()) { toast.error("Please add a comment explaining the reason"); return; }
    setDenyBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await (supabase as any).from("client_requirement_documents")
        .update({
          status: "rejected",
          rejection_reason: denyReason.trim(),
          rejected_at: new Date().toISOString(),
          rejected_by: userData?.user?.id ?? null,
          updated_at: new Date().toISOString(),
        }).eq("id", denyDoc.id);
      if (error) throw error;
      toast.success("Document denied — respondent has been notified");
      setDenyDoc(null);
      setDenyReason("");
      if (reviewCat) openReview(reviewCat);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setDenyBusy(false); }
  };

  const openDoc = async (url: string) => {
    if (/^https?:\/\//i.test(url)) { window.open(url, "_blank"); return; }
    const { data, error } = await (supabase as any).storage.from("intake-documents").createSignedUrl(url, 300);
    if (error || !data?.signedUrl) { toast.error("Unable to open document"); return; }
    window.open(data.signedUrl, "_blank");
  };

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
      const { error: seedError } = await (supabase as any).rpc("seed_deal_from_intake", {
        p_deal_id: deal.id,
        p_intake_id: intakeId,
      });
      if (seedError) throw seedError;
      await (supabase as any).from("client_intakes").update({
        status: "converted_to_deal",
        converted_deal_id: deal.id,
      }).eq("id", intakeId);
      toast.success("Deal workspace created with intake progress");
      navigate(`/deals/${deal.id}/dashboard`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  if (loading || !intake) return (
    <PageShell>
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <GlassIcon icon={FolderOpen} size="lg" />
          <span>Loading…</span>
        </div>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      <div className="absolute top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="max-w-6xl mx-auto py-10 px-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/welcome")} className="mb-4 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-surface-strong">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold font-display tracking-tight">{intake.company_name}</CardTitle>
                    <CardDescription className="mt-1">
                      <span className="font-mono text-primary font-medium">{intake.intake_code}</span> · {intake.client_type} · Status: {intake.status.replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <Badge variant={intake.status === "approved" ? "default" : "secondary"} className="shrink-0">
                    {intake.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-3">
                  <Progress value={overall} className="h-2 flex-1" />
                  <span className="text-sm font-semibold tabular-nums text-primary">{overall}%</span>
                </div>
                <p className="text-xs text-muted-foreground">Overall completion across selected categories</p>
              </CardContent>
            </Card>

            <Card className="glass-surface">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <GlassIcon icon={ShieldCheck} size="sm" />
                <CardTitle className="text-lg font-display tracking-tight">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {rows.length === 0 && <p className="text-sm text-muted-foreground">No categories selected.</p>}
                {rows.map((r) => {
                  const pct = r.total ? Math.round(((r.responses + r.documents) / r.total) * 100) : 0;
                  const missing = Math.max(0, r.total - r.responses - r.documents);
                  return (
                    <div key={r.id} className="glass-surface p-4 lift-hover">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <GlassIcon icon={FolderOpen} size="sm" tone="neutral" />
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs font-bold text-destructive">{r.category_code}</span>
                              <h3 className="font-semibold">{r.category_name}</h3>
                            </div>
                          </div>
                        </div>
                        <Badge variant={r.status === "approved" ? "default" : r.status === "changes_requested" ? "destructive" : "secondary"} className="shrink-0">
                          {r.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={pct} className="h-1.5 flex-1" />
                        <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>{r.responses} responses</span>
                        <span>{r.documents} documents</span>
                        <span className={missing > 0 ? "text-destructive font-medium" : ""}>{missing} missing</span>
                      </div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => openReview(r)}>
                          <Eye className="h-3.5 w-3.5" /> Review documents
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => requestClarification(r.category_id)}>
                          <MessageSquare className="h-3.5 w-3.5" /> Request clarification
                        </Button>
                        <Button size="sm" className="gap-1.5 bg-gradient-primary hover:opacity-90 transition-opacity" disabled={busy || r.status === "approved"} onClick={() => approveCategory(r.id)}>
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
            <Card className="glass-surface-strong">
              <CardHeader className="flex flex-row items-center gap-3 pb-2">
                <GlassIcon icon={Sparkles} size="sm" />
                <CardTitle className="text-lg font-display tracking-tight">Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {intake.status !== "approved" && intake.status !== "converted_to_deal" && (
                  <Button className="w-full gap-2 bg-gradient-primary hover:opacity-90 transition-opacity" disabled={!allApproved || busy} onClick={approveIntake}>
                    <CheckCircle2 className="h-4 w-4" /> Approve Full Intake
                  </Button>
                )}
                {intake.status === "approved" && (
                  <Button className="w-full gap-2 bg-gradient-brand hover:opacity-90 transition-opacity" disabled={busy} onClick={createDeal}>
                    <Rocket className="h-4 w-4" /> Create Deal Workspace
                  </Button>
                )}
                {intake.status === "converted_to_deal" && intake.converted_deal_id && (
                  <Button className="w-full gap-2" variant="outline" onClick={() => navigate(`/deals/${intake.converted_deal_id}/dashboard`)}>
                    <ExternalLink className="h-4 w-4" /> Open Deal Dashboard
                  </Button>
                )}
                {!allApproved && intake.status !== "converted_to_deal" && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive" />
                    <span>All categories must be approved before creating a deal.</span>
                  </div>
                )}
              </CardContent>
            </Card>
            <MiaInsights />
          </div>
        </div>
      </div>

      <Dialog open={!!reviewCat} onOpenChange={(o) => !o && setReviewCat(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto glass-surface-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <GlassIcon icon={ShieldCheck} size="sm" />
              <span className="text-destructive font-bold">{reviewCat?.category_code}</span>
              <span className="font-display tracking-tight">{reviewCat?.category_name}</span>
            </DialogTitle>
            <DialogDescription>Review uploaded documents and respondent answers. Approve or deny each document.</DialogDescription>
          </DialogHeader>

          {reviewLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}

          {reviewData && (
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <GlassIcon icon={FileText} size="sm" /> Documents ({reviewData.documents.length})
                </h4>
                {reviewData.documents.length === 0 && (
                  <div className="glass-surface p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> No documents uploaded yet.
                  </div>
                )}
                <div className="space-y-2">
                  {reviewData.documents.map((d: any) => {
                    const req = reviewData.requirements.find((r: any) => r.id === d.requirement_id);
                    return (
                      <div key={d.id} className="glass-surface p-3">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">{d.file_name}</span>
                              <Badge variant={d.status === "approved" ? "default" : d.status === "rejected" ? "destructive" : "secondary"}>
                                {d.status}
                              </Badge>
                              {d.version > 1 && (
                                <Badge variant="outline" className="gap-1 border-primary/40 text-primary bg-primary/5">
                                  <RefreshCw className="h-3 w-3" /> New version (v{d.version})
                                </Badge>
                              )}
                            </div>
                            {req && <p className="text-xs text-muted-foreground mt-0.5">{req.requirement_code} · {req.requirement_text}</p>}
                            {d.upload_comment && (
                              <div className="flex items-start gap-1.5 text-xs italic mt-1 text-muted-foreground">
                                <MessageSquare className="h-3 w-3 shrink-0 mt-0.5" />
                                <span>"{d.upload_comment}"</span>
                              </div>
                            )}
                            {d.status === "rejected" && d.rejection_reason && (
                              <div className="flex items-start gap-1.5 text-xs mt-1 text-destructive">
                                <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                                <span>Denied reason: {d.rejection_reason}</span>
                              </div>
                            )}
                            {d.uploaded_by_email && <p className="text-[10px] text-muted-foreground mt-0.5">by {d.uploaded_by_email}</p>}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => openDoc(d.file_url)}>
                              <ExternalLink className="h-3.5 w-3.5" /> View
                            </Button>
                            <Button size="sm" variant="default" className="gap-1 bg-gradient-primary hover:opacity-90 transition-opacity" disabled={d.status === "approved"} onClick={() => approveDoc(d.id)}>
                              <ThumbsUp className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1" disabled={d.status === "rejected"} onClick={() => { setDenyDoc(d); setDenyReason(""); }}>
                              <ThumbsDown className="h-3.5 w-3.5" /> Deny
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <GlassIcon icon={Mail} size="sm" tone="neutral" /> Responses ({reviewData.responses.length})
                </h4>
                {reviewData.responses.length === 0 && (
                  <div className="glass-surface p-4 text-xs text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> No responses submitted yet.
                  </div>
                )}
                <div className="space-y-2">
                  {reviewData.responses.map((resp: any) => {
                    const req = reviewData.requirements.find((r: any) => r.id === resp.requirement_id);
                    const val = resp.response_value ?? (resp.yes_no_value === null ? null : resp.yes_no_value ? "Yes" : "No") ?? resp.applicable_status;
                    return (
                      <div key={resp.requirement_id} className="rounded-md border border-border/50 bg-background/40 p-3 text-sm">
                        <p className="text-xs text-muted-foreground">{req?.requirement_code} · {req?.requirement_text}</p>
                        <p className="mt-1">{val ?? <span className="text-muted-foreground italic">No answer</span>}</p>
                        {resp.comment && <p className="text-xs italic text-muted-foreground mt-1">"{resp.comment}"</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!denyDoc} onOpenChange={(o) => { if (!o) { setDenyDoc(null); setDenyReason(""); } }}>
        <DialogContent className="max-w-md backdrop-blur-xl bg-card/95 border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-destructive" /> Deny document</DialogTitle>
            <DialogDescription>
              Add a comment explaining why this document is being denied. The respondent will see your feedback and can re-upload a new version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground truncate">{denyDoc?.file_name}</p>
            <Textarea
              rows={4}
              placeholder="e.g. This is the wrong document — please upload the signed copy dated within the last 12 months."
              value={denyReason}
              onChange={(e) => setDenyReason(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDenyDoc(null); setDenyReason(""); }} disabled={denyBusy}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeny} disabled={denyBusy || !denyReason.trim()} className="gap-1">
              <ThumbsDown className="h-3.5 w-3.5" /> Confirm denial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
