import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, registerDocument } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { PageShell } from "@/components/ui/page-shell";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, FileText, AlertCircle, RefreshCw, CheckCircle,
  UploadCloud, Paperclip,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Req {
  id: string;
  requirement_code: string;
  requirement_text: string;
  input_type: "document_upload" | "document_upload_with_comment" | string;
}

export default function CategoryPart2() {
  const { intakeId, categoryCode } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [intakeMeta, setIntakeMeta] = useState<{ intake_code?: string; company_name?: string }>({});
  const [reqs, setReqs] = useState<Req[]>([]);
  const [uploaded, setUploaded] = useState<Record<string, any[]>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<string[]>([]);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const loadDetail = async () => {
    const session = getIntakeSession();
    const { data, error } = await supabase.rpc("get_intake_category_detail", {
      p_intake_id: intakeId,
      p_token: session.accessToken,
      p_category_code: categoryCode,
    });
    if (error) throw error;
    const payload = data as any;
    setCategory(payload?.category);
    const allReqs: Req[] = payload?.requirements ?? [];
    const filtered = allReqs.filter((r) => ["document_upload","document_upload_with_comment"].includes(r.input_type));
    setReqs(filtered);
    if (filtered.length > 0 && !activeReqId) setActiveReqId(filtered[0].id);
    const grouped: Record<string, any[]> = {};
    (payload?.documents ?? []).forEach((d: any) => {
      grouped[d.requirement_id] ??= [];
      grouped[d.requirement_id].push(d);
    });
    setUploaded(grouped);
  };

  useEffect(() => {
    const session = getIntakeSession();
    if (!session.accessToken || session.intakeId !== intakeId) { navigate("/respond"); return; }
    setIntakeMeta({ intake_code: session.intakeCode ?? undefined });
    (async () => {
      const { data: overview } = await supabase.rpc("get_intake_overview", {
        p_intake_id: intakeId,
        p_token: session.accessToken,
      });
      setOrder(((overview as any)?.categories ?? []).map((c: any) => c.category_code));
    })();
    loadDetail()
      .catch((e) => { toast.error(e.message ?? "Failed"); navigate(`/respond/${intakeId}`); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intakeId, categoryCode, navigate]);

  const idx = order.indexOf(categoryCode ?? "");
  const isLast = idx >= 0 && idx === order.length - 1;
  const nextCode = !isLast && idx >= 0 ? order[idx + 1] : null;

  const uploadedCount = useMemo(
    () => reqs.filter((r) => (uploaded[r.id]?.length ?? 0) > 0).length,
    [reqs, uploaded]
  );

  const onFile = async (req: Req, files: FileList | null, replacesDocumentId: string | null = null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${intakeId}/${req.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("intake-documents").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("intake-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
        await registerDocument({
          requirementId: req.id,
          fileName: file.name,
          fileUrl: signed?.signedUrl ?? path,
          fileType: file.type,
          fileSize: file.size,
          uploadComment: comments[req.id] ?? null,
          replacesDocumentId,
        });
      }
      toast.success(replacesDocumentId ? "New version uploaded — sent for review" : "Uploaded");
      await loadDetail();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally { setBusy(false); }
  };

  const submitCategory = async () => {
    if (!category) return;
    setBusy(true);
    try {
      const session = getIntakeSession();
      const { error } = await supabase.rpc("submit_intake_category", {
        p_intake_id: intakeId,
        p_token: session.accessToken,
        p_category_id: category.id,
      });
      if (error) throw error;
      toast.success(isLast ? "All categories submitted" : "Category submitted");
      if (nextCode) navigate(`/respond/${intakeId}/category/${nextCode}/part-2`);
      else navigate(`/respond/${intakeId}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  const scrollTo = (id: string) => {
    setActiveReqId(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  const activeReq = reqs.find((r) => r.id === activeReqId) ?? reqs[0];

  return (
    <PageShell>
      <RespondentHeader intakeCode={intakeMeta.intake_code} companyName={intakeMeta.company_name} />

      {/* Console header strip */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/respond/${intakeId}`)} className="gap-1 -ml-3">
            <ArrowLeft className="h-4 w-4" /> Overview
          </Button>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-destructive font-bold">
            Act II · Documents
          </span>
          <span className="text-foreground/60">/</span>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {categoryCode} · {category?.category_name}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="tabular-nums font-mono">{uploadedCount}/{reqs.length}</span>
              <span>document slots filled</span>
            </div>
            <Button size="sm" className="gap-2 rounded-md" onClick={submitCategory} disabled={busy}>
              <CheckCircle2 className="h-4 w-4" />
              {nextCode ? `Submit & continue → ${nextCode}` : "Submit & finish"}
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[280px_1fr] gap-8">
        {/* LEFT — requirement sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">Slots</p>
              <span className="text-[10px] font-mono text-destructive">{reqs.length}</span>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto">
              {reqs.length === 0 && (
                <li className="px-4 py-6 text-xs text-muted-foreground italic">No documents required.</li>
              )}
              {reqs.map((r) => {
                const docs = uploaded[r.id] ?? [];
                const filled = docs.length > 0;
                const approved = docs.some((d) => d.status === "approved");
                const rejected = docs.some((d) => d.status === "rejected");
                const active = r.id === activeReqId;
                return (
                  <li key={r.id} className={`border-b border-border/30 last:border-0 ${active ? "bg-destructive/5" : ""}`}>
                    <button
                      onClick={() => scrollTo(r.id)}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-card/60 transition-colors"
                    >
                      <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                        approved ? "bg-green-500" : rejected ? "bg-destructive" : filled ? "bg-amber-500" : "bg-border"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-[10px] uppercase tracking-wider text-destructive">{r.requirement_code}</p>
                        <p className="text-xs leading-snug mt-0.5 line-clamp-2">{r.requirement_text}</p>
                      </div>
                      {filled && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* MAIN — workspace cards */}
        <section className="space-y-6 pb-12">
          {reqs.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-xl p-10 text-center text-sm text-muted-foreground">
              No documents required for this category.
            </div>
          )}

          {reqs.map((r) => {
            const docs = uploaded[r.id] ?? [];
            const isActive = r.id === activeReqId;
            return (
              <motion.div
                key={r.id}
                ref={(el) => (sectionRefs.current[r.id] = el)}
                onMouseEnter={() => setActiveReqId(r.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl border bg-card/40 backdrop-blur-xl overflow-hidden transition-all ${
                  isActive ? "border-destructive/40 shadow-glow-primary-lg" : "border-border/50"
                }`}
              >
                <div className="px-6 py-4 border-b border-border/40 flex items-baseline gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-destructive tabular-nums px-2 py-0.5 rounded bg-destructive/10">
                    {r.requirement_code}
                  </span>
                  <p className="font-medium text-sm flex-1 min-w-0">{r.requirement_text}</p>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {docs.length} file{docs.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Drop zone */}
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      onFile(r, e.dataTransfer.files);
                    }}
                    className={`block cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                      dragOver
                        ? "border-destructive bg-destructive/5"
                        : "border-border/60 hover:border-destructive/50 hover:bg-card/30"
                    }`}
                  >
                    <UploadCloud className="h-8 w-8 mx-auto text-destructive/80 mb-2" />
                    <p className="text-sm font-medium">Drop files here, or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Multiple files supported</p>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={busy}
                      onChange={(e) => onFile(r, e.target.files)}
                    />
                  </label>

                  {r.input_type === "document_upload_with_comment" && (
                    <Textarea
                      rows={2}
                      placeholder="Optional comment for the next upload"
                      value={comments[r.id] ?? ""}
                      onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))}
                    />
                  )}

                  {/* Uploaded files as tile grid */}
                  {docs.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-3 pt-2">
                      {docs.map((d) => {
                        const isRejected = d.status === "rejected";
                        const isApproved = d.status === "approved";
                        return (
                          <div
                            key={d.id}
                            className={`relative rounded-xl border p-3 ${
                              isRejected ? "border-destructive/40 bg-destructive/5"
                                : isApproved ? "border-green-500/30 bg-green-500/5"
                                : "border-border/50 bg-background/40"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border/50">
                                <FileText className="h-4 w-4 text-destructive" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{d.file_name}</p>
                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                  {d.version > 1 && (
                                    <Badge variant="outline" className="gap-1 h-4 px-1.5 text-[10px]">
                                      <RefreshCw className="h-2.5 w-2.5" /> v{d.version}
                                    </Badge>
                                  )}
                                  {isApproved && (
                                    <Badge className="gap-1 h-4 px-1.5 text-[10px] bg-green-600 hover:bg-green-600">
                                      <CheckCircle className="h-2.5 w-2.5" /> Approved
                                    </Badge>
                                  )}
                                  {isRejected && (
                                    <Badge variant="destructive" className="gap-1 h-4 px-1.5 text-[10px]">
                                      <AlertCircle className="h-2.5 w-2.5" /> Denied
                                    </Badge>
                                  )}
                                  {!isApproved && !isRejected && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">Pending</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            {d.upload_comment && (
                              <p className="italic mt-2 text-[11px] text-muted-foreground">— {d.upload_comment}</p>
                            )}
                            {isRejected && d.rejection_reason && (
                              <div className="mt-2 rounded-md bg-destructive/10 border border-destructive/30 p-2">
                                <p className="font-semibold text-destructive mb-0.5 text-[11px]">Advisor feedback</p>
                                <p className="text-[11px] text-foreground">{d.rejection_reason}</p>
                                <label className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium cursor-pointer text-destructive">
                                  <RefreshCw className="h-3 w-3" />
                                  <span className="underline">Re-upload new version</span>
                                  <input
                                    type="file"
                                    className="hidden"
                                    disabled={busy}
                                    onChange={(e) => onFile(r, e.target.files, d.id)}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </section>
      </main>
    </PageShell>
  );
}
