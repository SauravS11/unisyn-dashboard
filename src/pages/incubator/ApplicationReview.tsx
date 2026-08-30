import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Activity,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FileText,
  MessageSquareText,
  Radio,
  ShieldQuestion,
  Timer,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { fetchWorkflowChecklist, type WorkflowSection } from "@/lib/incubatorClient";
import { APPLICATION_STATUS_LABELS, SECTION_STATUS_LABELS } from "@/lib/fundingWorkflows";
import { getProgressColors } from "@/lib/progressColors";
import { toast } from "sonner";

const REQUESTED_ACTIONS = [
  "Update Response",
  "Upload Document",
  "Replace Document",
  "Add Explanation",
  "Confirm Information",
  "Other",
];

const ApplicationReview = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState<any>(null);
  const [sections, setSections] = useState<WorkflowSection[]>([]);
  const [appSections, setAppSections] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [clarifications, setClarifications] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  const [reviewSection, setReviewSection] = useState<WorkflowSection | null>(null);
  const [clarSection, setClarSection] = useState<WorkflowSection | null>(null);
  const [clarForm, setClarForm] = useState({
    title: "",
    requirement_id: "",
    message: "",
    requested_action: "Update Response",
    priority: "Medium",
    due_date: "",
  });

  const load = useCallback(async () => {
    const { data: a } = await supabase
      .from("applications")
      .select("*, funding_workflows(name, slug, code_prefix)")
      .eq("id", applicationId)
      .maybeSingle();
    if (!a) return;
    setApp(a);
    setSections(await fetchWorkflowChecklist(a.funding_workflow_id));
    const [s, r, d, c, act] = await Promise.all([
      supabase.from("application_sections").select("*").eq("application_id", applicationId),
      supabase.from("application_responses").select("*").eq("application_id", applicationId),
      supabase.from("application_documents").select("*").eq("application_id", applicationId).order("uploaded_at", { ascending: false }),
      supabase.from("application_clarifications").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }),
      supabase.from("application_activity").select("*").eq("application_id", applicationId).order("created_at", { ascending: false }).limit(8),
    ]);
    setAppSections(s.data ?? []);
    setResponses(r.data ?? []);
    setDocuments(d.data ?? []);
    setClarifications(c.data ?? []);
    setActivity(act.data ?? []);
  }, [applicationId]);

  useEffect(() => {
    load();
  }, [load]);

  // realtime updates from the applicant
  useEffect(() => {
    if (!applicationId) return;
    const channel = supabase
      .channel(`application-${applicationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_responses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_documents" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_sections" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_activity" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, load]);

  const stats = useMemo(() => {
    const allReqs = sections.flatMap((s) => s.requirements ?? []);
    const docReqs = allReqs.filter((r) => r.input_type !== "response");
    const respReqs = allReqs.filter((r) => r.input_type !== "document");
    const done = respReqs.filter((r) => responses.some((x) => x.requirement_id === r.id)).length +
      docReqs.filter((r) => documents.some((x) => x.requirement_id === r.id)).length;
    const total = respReqs.length + docReqs.length;
    const days = app?.due_date
      ? Math.ceil((new Date(app.due_date).getTime() - Date.now()) / 86400000)
      : null;
    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      open: total - done,
      pendingReview: appSections.filter((s) => s.status === "submitted").length,
      clarifications: clarifications.filter((c) => c.status !== "resolved").length,
      documents: documents.length,
      days,
    };
  }, [sections, responses, documents, appSections, clarifications, app]);

  const sectionStats = (s: WorkflowSection) => {
    const reqs = s.requirements ?? [];
    const docReqs = reqs.filter((r) => r.input_type !== "response");
    const respReqs = reqs.filter((r) => r.input_type !== "document");
    const rDone = respReqs.filter((r) => responses.some((x) => x.requirement_id === r.id)).length;
    const dDone = docReqs.filter((r) => documents.some((x) => x.requirement_id === r.id)).length;
    const total = respReqs.length + docReqs.length;
    const pct = total ? Math.round(((rDone + dDone) / total) * 100) : 0;
    const state = appSections.find((x) => x.section_id === s.id);
    return { rDone, dDone, respTotal: respReqs.length, docTotal: docReqs.length, pct, missing: total - rDone - dDone, status: state?.status ?? "not_started" };
  };

  const setSectionStatus = async (sectionId: string, status: string, label: string) => {
    const { error } = await supabase
      .from("application_sections")
      .update({
        status,
        ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}),
        reviewed_at: new Date().toISOString(),
      })
      .eq("application_id", applicationId)
      .eq("section_id", sectionId);
    if (error) return toast.error(error.message);
    await supabase.from("application_activity").insert({
      application_id: applicationId,
      activity_type: "section_" + status,
      description: label,
      actor_type: "manager",
    });
    toast.success(label);
    load();
  };

  const sendClarification = async () => {
    if (!clarForm.title.trim() || !clarForm.message.trim()) return toast.error("Add a title and a message");
    const { error } = await supabase.from("application_clarifications").insert({
      application_id: applicationId,
      section_id: clarSection?.id ?? null,
      requirement_id: clarForm.requirement_id || null,
      title: clarForm.title,
      message: clarForm.message,
      requested_action: clarForm.requested_action,
      priority: clarForm.priority,
      due_date: clarForm.due_date || null,
      status: "open",
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    if (clarSection) {
      await supabase
        .from("application_sections")
        .update({ status: "needs_attention" })
        .eq("application_id", applicationId)
        .eq("section_id", clarSection.id);
    }
    await supabase.from("applications").update({ status: "clarification_requested" }).eq("id", applicationId);
    await supabase.from("application_activity").insert({
      application_id: applicationId,
      activity_type: "clarification_requested",
      description: `Clarification requested: ${clarForm.title}`,
      actor_type: "manager",
    });
    toast.success("Clarification request sent");
    setClarSection(null);
    setClarForm({ title: "", requirement_id: "", message: "", requested_action: "Update Response", priority: "Medium", due_date: "" });
    load();
  };

  const approveDocument = async (id: string, approve: boolean, reason?: string) => {
    const { error } = await supabase
      .from("application_documents")
      .update(
        approve
          ? { status: "approved", rejection_reason: null, rejected_at: null }
          : { status: "changes_requested", rejection_reason: reason ?? "Please re-upload this document", rejected_at: new Date().toISOString() },
      )
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(approve ? "Document approved" : "Re-upload requested");
    load();
  };

  const approveApplication = async () => {
    if (stats.clarifications > 0) return toast.error("Resolve all open clarifications first");
    if (stats.open > 0) return toast.error("All required items must be complete before approval");
    const { error } = await supabase
      .from("applications")
      .update({ status: "approved", approved_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (error) return toast.error(error.message);
    toast.success("Full application approved");
    load();
  };

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(path, 300);
    if (error) return toast.error(error.message);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const summary = [
    { icon: ClipboardList, label: "Application Completion", value: `${stats.pct}%` },
    { icon: CircleAlert, label: "Open Requirements", value: stats.open },
    { icon: Timer, label: "Pending Review", value: stats.pendingReview },
    { icon: ShieldQuestion, label: "Clarifications Requested", value: stats.clarifications },
    { icon: Upload, label: "Documents Uploaded", value: stats.documents },
    { icon: Activity, label: "Days Until Due", value: stats.days ?? "—" },
  ];

  const missingBySection = sections
    .map((s) => ({ s, st: sectionStats(s) }))
    .filter((x) => x.st.missing > 0);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" className="rounded-full gap-2 mb-6" onClick={() => navigate("/incubator/applications")}>
          <ArrowLeft className="h-4 w-4" /> Back to Applications
        </Button>

        {/* Header */}
        <div className="glass-surface-strong p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">Applicant</p>
              <h1 className="font-display text-3xl sm:text-4xl tracking-tight">{app?.business_name}</h1>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="font-mono">{app?.application_code}</span>
                <span>{app?.funding_workflows?.name}</span>
                <Badge variant="outline" className="rounded-full">
                  {APPLICATION_STATUS_LABELS[app?.status] ?? app?.status}
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-green-600">
                  <Radio className="h-3.5 w-3.5" /> Live sync active
                </span>
              </div>
            </div>
            <div className="min-w-[220px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Overall Completion</p>
              <div className="flex items-center gap-3">
                <Progress value={stats.pct} className="h-2" />
                <span className="font-semibold tabular-nums">{stats.pct}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Real-time updates from applicant · {stats.done} of {stats.total} required items complete
              </p>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {summary.map((c) => (
            <div key={c.label} className="glass-surface p-4">
              <GlassIcon icon={c.icon} tone="neutral" size="sm" />
              <p className="text-2xl font-semibold tabular-nums mt-3">{c.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-display text-2xl">Application Sections</h2>
            {sections.map((s) => {
              const st = sectionStats(s);
              const colors = getProgressColors(st.pct);
              return (
                <div key={s.id} className="glass-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <GlassIcon icon={s.section_code === "G" ? FileText : ClipboardList} size="lg" />
                      <div>
                        <p className="font-display text-lg leading-tight">
                          {s.section_code} — {s.section_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {st.rDone}/{st.respTotal} responses · {st.dDone}/{st.docTotal} documents ·{" "}
                          {st.missing} missing
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`rounded-full ${colors.text}`}>
                      {SECTION_STATUS_LABELS[st.status] ?? st.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    <Progress value={st.pct} className="h-1.5" />
                    <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{st.pct}%</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setReviewSection(s)}>
                      <ClipboardList className="h-4 w-4" /> Review Submission
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full gap-2" onClick={() => setClarSection(s)}>
                      <MessageSquareText className="h-4 w-4" /> Request Clarification
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full gap-2 bg-gradient-success text-success-foreground"
                      onClick={() => setSectionStatus(s.id, "approved", `Approved ${s.section_code} — ${s.section_name}`)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Approve Section
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">Next Steps</h3>
              <Button className="w-full rounded-full bg-gradient-success text-success-foreground gap-2 mb-3" onClick={approveApplication}>
                <CheckCircle2 className="h-4 w-4" /> Approve Full Application
              </Button>
              <Button variant="outline" className="w-full rounded-full gap-2" onClick={() => setClarSection(sections[0] ?? null)}>
                <MessageSquareText className="h-4 w-4" /> Request Clarification
              </Button>
              <p className="text-xs text-muted-foreground mt-3">
                You can approve the application once all required sections are complete and reviewed.
              </p>
            </div>

            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">Missing Requirements</h3>
              {missingBySection.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing outstanding.</p>
              ) : (
                <ul className="space-y-3">
                  {missingBySection.map(({ s, st }) => (
                    <li key={s.id} className="text-sm">
                      <p className="font-medium">
                        {s.section_code} — {s.section_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {st.respTotal - st.rDone} responses · {st.docTotal - st.dDone} documents outstanding
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="glass-surface p-5">
              <h3 className="font-display text-xl mb-4">Live Applicant Activity</h3>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p>{a.description}</p>
                      <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section review modal */}
      <Dialog open={!!reviewSection} onOpenChange={(o) => !o && setReviewSection(null)}>
        <DialogContent className="max-w-3xl glass-surface-strong max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {reviewSection?.section_code} — {reviewSection?.section_name}
            </DialogTitle>
            <DialogDescription>
              {app?.funding_workflows?.name} · Applicant activity updates appear here in real time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {(reviewSection?.requirements ?? []).map((r) => {
              const resp = responses.find((x) => x.requirement_id === r.id);
              const docs = documents.filter((x) => x.requirement_id === r.id);
              const latest = docs[0];
              const status = r.input_type === "response"
                ? resp
                  ? "New Response"
                  : "Missing"
                : latest
                  ? latest.status === "approved"
                    ? "Approved"
                    : latest.status === "changes_requested"
                      ? "Needs Clarification"
                      : "Uploaded"
                  : "Missing";
              const tone =
                status === "Missing"
                  ? "text-destructive"
                  : status === "Approved" || status === "Uploaded"
                    ? "text-green-600"
                    : status === "Needs Clarification"
                      ? "text-amber-600"
                      : "text-blue-600";
              return (
                <div key={r.id} className="glass-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{r.requirement_text}</p>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                        {reviewSection?.section_code}
                        {r.sort_order}
                      </p>
                    </div>
                    <Badge variant="outline" className={`rounded-full shrink-0 ${tone}`}>
                      {status}
                    </Badge>
                  </div>

                  {resp?.response_value && (
                    <p className="text-sm mt-3 p-3 rounded-xl bg-muted/40 whitespace-pre-wrap">{resp.response_value}</p>
                  )}

                  {docs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {docs.map((d) => (
                        <div key={d.id} className="flex flex-wrap items-center gap-2 text-xs">
                          <button className="underline text-primary" onClick={() => openDoc(d.file_url)}>
                            {d.file_name}
                          </button>
                          {d.version > 1 && (
                            <Badge variant="outline" className="rounded-full text-[10px]">
                              New version (v{d.version})
                            </Badge>
                          )}
                          <span className="text-muted-foreground">{new Date(d.uploaded_at).toLocaleString()}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full h-7 text-[11px] ml-auto"
                            onClick={() => approveDocument(d.id, false, "Please upload a clearer or updated document")}
                          >
                            Request Upload
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-full h-7 text-[11px] bg-gradient-success text-success-foreground"
                            onClick={() => approveDocument(d.id, true)}
                          >
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="text-[11px] text-muted-foreground justify-start">
            Latest update: {app?.updated_at ? new Date(app.updated_at).toLocaleString() : "—"} · Applicant:{" "}
            {app?.business_name}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clarification modal */}
      <Dialog open={!!clarSection} onOpenChange={(o) => !o && setClarSection(null)}>
        <DialogContent className="max-w-lg glass-surface-strong">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Request Clarification</DialogTitle>
            <DialogDescription>
              {clarSection ? `${clarSection.section_code} — ${clarSection.section_name}` : "Full application"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Clarification Title</Label>
              <Input value={clarForm.title} onChange={(e) => setClarForm({ ...clarForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Related Requirement</Label>
              <Select value={clarForm.requirement_id} onValueChange={(v) => setClarForm({ ...clarForm, requirement_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {(clarSection?.requirements ?? []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.requirement_text.slice(0, 60)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Message to Applicant</Label>
              <Textarea rows={4} value={clarForm.message} onChange={(e) => setClarForm({ ...clarForm, message: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Requested Action</Label>
                <Select value={clarForm.requested_action} onValueChange={(v) => setClarForm({ ...clarForm, requested_action: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUESTED_ACTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={clarForm.priority} onValueChange={(v) => setClarForm({ ...clarForm, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={clarForm.due_date} onChange={(e) => setClarForm({ ...clarForm, due_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setClarSection(null)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={sendClarification}>
              Send Clarification Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default ApplicationReview;
