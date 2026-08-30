import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, FileText, MessageSquareText, Radio, Upload } from "lucide-react";
import {
  getApplicationSection,
  getApplicationSession,
  openApplicationDocument,
  saveApplicationResponse,
  submitClarificationUpdate,
  submitSection,
  uploadApplicationDocument,
} from "@/lib/incubatorClient";
import { toast } from "sonner";

const ApplicantSection = () => {
  const { applicationId, sectionCode } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!sectionCode) return;
    try {
      const d = await getApplicationSection(sectionCode);
      setData(d);
      const map: Record<string, string> = {};
      (d.responses ?? []).forEach((r: any) => (map[r.requirement_id] = r.response_value ?? ""));
      setAnswers(map);
    } catch (e: any) {
      toast.error(e.message ?? "Session expired");
      navigate("/apply");
    }
  }, [sectionCode, navigate]);

  useEffect(() => {
    const { applicationId: id } = getApplicationSession();
    if (!id) {
      navigate("/apply");
      return;
    }
    load();
  }, [load, navigate]);

  const requirements: any[] = data?.requirements ?? [];
  const questions = requirements.filter((r) => r.input_type !== "document");
  const docReqs = requirements.filter((r) => r.input_type !== "response");
  const documents: any[] = data?.documents ?? [];
  const clarifications: any[] = data?.clarifications ?? [];

  const total = questions.length + docReqs.length;
  const done =
    questions.filter((q) => (answers[q.id] ?? "").trim().length > 0).length +
    docReqs.filter((r) => documents.some((d) => d.requirement_id === r.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const saveAll = async () => {
    setBusy(true);
    try {
      for (const q of questions) {
        const v = (answers[q.id] ?? "").trim();
        if (v) await saveApplicationResponse(q.id, v);
      }
      toast.success("Progress saved");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const missing = questions.filter((q) => q.is_required && !(answers[q.id] ?? "").trim());
    if (missing.length) return toast.error(`${missing.length} required question(s) still need an answer`);
    setBusy(true);
    try {
      await saveAll();
      await submitSection(data.section.id);
      toast.success("Section submitted for review");
      navigate(`/apply/${applicationId}`);
    } catch (e: any) {
      toast.error(e.message ?? "Could not submit the section");
    } finally {
      setBusy(false);
    }
  };

  const upload = async (requirementId: string, file: File, replaces?: string | null) => {
    setBusy(true);
    try {
      await uploadApplicationDocument({ requirementId, file, replacesDocumentId: replaces ?? null });
      toast.success(replaces ? "New version uploaded" : "Document uploaded");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Button variant="ghost" className="rounded-full gap-2 mb-6" onClick={() => navigate(`/apply/${applicationId}`)}>
          <ArrowLeft className="h-4 w-4" /> Back to Application
        </Button>

        <div className="glass-surface-strong p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <GlassIcon icon={sectionCode === "G" ? FileText : MessageSquareText} size="xl" />
              <div>
                <h1 className="font-display text-3xl tracking-tight">
                  {data?.section?.section_code} — {data?.section?.section_name}
                </h1>
                <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-green-600" /> Your answers are saved securely as you go
                </p>
              </div>
            </div>
            <div className="min-w-[180px]">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Section Progress</p>
              <div className="flex items-center gap-3">
                <Progress value={pct} className="h-2" />
                <span className="font-semibold tabular-nums text-sm">{pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {clarifications.length > 0 && (
          <div className="glass-surface p-5 mb-6 border-amber-500/40">
            <Badge variant="outline" className="rounded-full text-amber-600 border-amber-500/40 mb-3">
              Needs Attention
            </Badge>
            <p className="font-semibold">Your programme manager has requested an update for this section.</p>
            {clarifications.map((c) => (
              <div key={c.id} className="mt-4 space-y-2">
                <p className="text-sm font-medium">{c.title}</p>
                <p className="text-sm text-muted-foreground">{c.message}</p>
                <p className="text-xs text-muted-foreground">
                  Action needed: {c.requested_action}
                  {c.due_date ? ` · Due ${new Date(c.due_date).toLocaleDateString()}` : ""}
                </p>
                <Textarea
                  rows={3}
                  placeholder="Add your explanation or update…"
                  onChange={(e) => setAnswers((p) => ({ ...p, [`clar-${c.id}`]: e.target.value }))}
                />
                <Button
                  size="sm"
                  className="rounded-full"
                  onClick={async () => {
                    try {
                      await submitClarificationUpdate(c.id, answers[`clar-${c.id}`] ?? "");
                      toast.success("Update submitted for review");
                      load();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}
                >
                  Submit Update
                </Button>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue={sectionCode === "G" ? "docs" : "questions"}>
          <TabsList className="glass-surface rounded-full p-1.5 mb-6">
            <TabsTrigger value="questions" className="rounded-full">
              Guided Questions ({questions.length})
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-full">
              Supporting Documents ({docReqs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground">This section only requires supporting documents.</p>
            )}
            {questions.map((q) => (
              <div key={q.id} className="glass-surface p-5">
                <Label className="text-sm font-medium">{q.requirement_text}</Label>
                <Textarea
                  className="mt-3"
                  rows={3}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
                  onBlur={() => {
                    const v = (answers[q.id] ?? "").trim();
                    if (v) saveApplicationResponse(q.id, v).catch(() => null);
                  }}
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="docs" className="space-y-4">
            {docReqs.length === 0 && (
              <p className="text-sm text-muted-foreground">No documents are required in this section.</p>
            )}
            {docReqs.map((r) => {
              const docs = documents.filter((d) => d.requirement_id === r.id);
              const latest = docs[0];
              return (
                <div key={r.id} className="glass-surface p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{r.requirement_text}</p>
                      {latest && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Uploaded {new Date(latest.uploaded_at).toLocaleString()} · v{latest.version}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`rounded-full shrink-0 ${
                        !latest
                          ? "text-destructive"
                          : latest.status === "approved"
                            ? "text-green-600"
                            : latest.status === "changes_requested"
                              ? "text-amber-600"
                              : "text-blue-600"
                      }`}
                    >
                      {!latest
                        ? "Missing"
                        : latest.status === "approved"
                          ? "Approved"
                          : latest.status === "changes_requested"
                            ? "Re-upload requested"
                            : "Uploaded"}
                    </Badge>
                  </div>

                  {latest?.status === "changes_requested" && latest.rejection_reason && (
                    <p className="text-xs text-amber-600 mt-3">Manager comment: {latest.rejection_reason}</p>
                  )}

                  {docs.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs">
                      {docs.map((d) => (
                        <li key={d.id} className="flex items-center gap-2">
                          <button className="underline text-primary" onClick={() => openApplicationDocument(d.file_url)}>
                            {d.file_name}
                          </button>
                          {d.version > 1 && <span className="text-muted-foreground">new version (v{d.version})</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-4">
                    <Input
                      type="file"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) upload(r.id, file, latest?.id ?? null);
                        e.currentTarget.value = "";
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1.5">
                      <Upload className="h-3 w-3" /> {latest ? "Uploading again creates a new version" : "Upload your document"}
                    </p>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap justify-end gap-3 mt-8">
          <Button variant="outline" className="rounded-full" onClick={() => navigate(`/apply/${applicationId}`)}>
            Back to Application
          </Button>
          <Button variant="outline" className="rounded-full" disabled={busy} onClick={saveAll}>
            Save Progress
          </Button>
          <Button className="rounded-full gap-2 bg-gradient-success text-success-foreground" disabled={busy} onClick={submit}>
            <CheckCircle2 className="h-4 w-4" /> Submit Section
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default ApplicantSection;
