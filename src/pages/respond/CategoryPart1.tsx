import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, submitResponse } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { PageShell } from "@/components/ui/page-shell";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Req {
  id: string;
  requirement_code: string;
  requirement_text: string;
  input_type: "written_response" | "yes_no" | "applicable_na" | string;
}

export default function CategoryPart1() {
  const { intakeId, categoryCode } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [intakeMeta, setIntakeMeta] = useState<{ intake_code?: string; company_name?: string }>({});
  const [reqs, setReqs] = useState<Req[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<string[]>([]);
  const [focusIdx, setFocusIdx] = useState(0);

  useEffect(() => {
    const session = getIntakeSession();
    if (!session.accessToken || session.intakeId !== intakeId) { navigate("/respond"); return; }
    setIntakeMeta({ intake_code: session.intakeCode ?? undefined });
    (async () => {
      const [{ data, error }, { data: overview }] = await Promise.all([
        supabase.rpc("get_intake_category_detail", {
          p_intake_id: intakeId,
          p_token: session.accessToken,
          p_category_code: categoryCode,
        }),
        supabase.rpc("get_intake_overview", {
          p_intake_id: intakeId,
          p_token: session.accessToken,
        }),
      ]);
      if (error) { toast.error(error.message); navigate(`/respond/${intakeId}`); return; }
      const payload = data as any;
      setCategory(payload?.category);
      const allReqs: Req[] = payload?.requirements ?? [];
      setReqs(allReqs.filter((r) => ["written_response","yes_no","applicable_na"].includes(r.input_type)));
      const v: Record<string, any> = {};
      (payload?.responses ?? []).forEach((e: any) => {
        v[e.requirement_id] = {
          response_value: e.response_value ?? "",
          yes_no_value: e.yes_no_value,
          applicable_status: e.applicable_status,
          comment: e.comment ?? "",
        };
      });
      setValues(v);
      setOrder(((overview as any)?.categories ?? []).map((c: any) => c.category_code));
      setFocusIdx(0);
      setLoading(false);
    })();
  }, [intakeId, categoryCode, navigate]);

  const update = (id: string, key: string, val: any) =>
    setValues((s) => ({ ...s, [id]: { ...(s[id] ?? {}), [key]: val } }));

  const idx = order.indexOf(categoryCode ?? "");
  const isLast = idx >= 0 && idx === order.length - 1;
  const nextCode = !isLast && idx >= 0 ? order[idx + 1] : null;

  const isAnswered = (r: Req) => {
    const v = values[r.id];
    if (!v) return false;
    if (r.input_type === "written_response") return !!v.response_value;
    if (r.input_type === "yes_no") return typeof v.yes_no_value === "boolean";
    if (r.input_type === "applicable_na") return !!v.applicable_status;
    return false;
  };

  const answeredCount = useMemo(() => reqs.filter(isAnswered).length, [reqs, values]);
  const pct = reqs.length ? Math.round((answeredCount / reqs.length) * 100) : 100;

  const saveAll = async (goNext: boolean) => {
    setBusy(true);
    try {
      for (const r of reqs) {
        const v = values[r.id];
        if (!v) continue;
        const hasValue = v.response_value || v.yes_no_value !== undefined || v.applicable_status || v.comment;
        if (!hasValue) continue;
        await submitResponse({
          requirementId: r.id,
          responseValue: v.response_value ?? null,
          yesNo: typeof v.yes_no_value === "boolean" ? v.yes_no_value : null,
          applicableStatus: v.applicable_status ?? null,
          comment: v.comment ?? null,
        });
      }
      toast.success("Saved");
      if (goNext) {
        if (nextCode) navigate(`/respond/${intakeId}/category/${nextCode}/part-1`);
        else if (order.length > 0) navigate(`/respond/${intakeId}/category/${order[0]}/part-2`);
        else navigate(`/respond/${intakeId}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  const current = reqs[focusIdx];

  return (
    <PageShell>
      <RespondentHeader intakeCode={intakeMeta.intake_code} companyName={intakeMeta.company_name} />

      <div className="max-w-6xl mx-auto px-6 pt-8">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/respond/${intakeId}`)} className="gap-1 -ml-3">
          <ArrowLeft className="h-4 w-4" /> Back to overview
        </Button>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-6 grid lg:grid-cols-[200px_1fr] gap-12 pb-32">
        {/* LEFT RAIL — question dots */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4">Questions</p>
          <ol className="space-y-1.5">
            {reqs.map((r, i) => {
              const answered = isAnswered(r);
              const active = i === focusIdx;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setFocusIdx(i)}
                    className={`w-full flex items-center gap-3 py-1.5 px-2 rounded-md text-left text-xs transition-colors ${
                      active ? "bg-destructive/10 text-foreground" : "hover:bg-card/40 text-muted-foreground"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${
                      answered ? "bg-destructive" : active ? "bg-destructive/40 ring-2 ring-destructive/30" : "bg-border"
                    }`} />
                    <span className="tabular-nums font-mono">{r.requirement_code}</span>
                    {answered && <Check className="h-3 w-3 ml-auto text-destructive" />}
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* MAIN — one question at a time, reading-room style */}
        <section>
          <div className="mb-10 flex items-baseline gap-3 flex-wrap">
            <span className="font-serif italic text-destructive text-2xl">{categoryCode}</span>
            <h1 className="font-serif text-3xl sm:text-4xl tracking-tight">{category?.category_name}</h1>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground ml-auto">
              Act I · {idx + 1} of {order.length}
            </span>
          </div>

          {reqs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No written responses required for this category.</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                <div className="flex items-baseline gap-4">
                  <span className="font-serif italic text-4xl text-destructive/80 tabular-nums">{current.requirement_code}</span>
                  <p className="font-serif text-2xl sm:text-3xl leading-snug tracking-tight">{current.requirement_text}</p>
                </div>

                <div className="pl-0 sm:pl-16">
                  {current.input_type === "written_response" && (
                    <Textarea
                      rows={8}
                      autoFocus
                      placeholder="Type your response…"
                      value={values[current.id]?.response_value ?? ""}
                      onChange={(e) => update(current.id, "response_value", e.target.value)}
                      className="text-base font-serif leading-relaxed bg-transparent border-0 border-b-2 border-border/60 rounded-none focus-visible:ring-0 focus-visible:border-destructive resize-none px-0"
                    />
                  )}
                  {current.input_type === "yes_no" && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        {[true, false].map((v) => (
                          <button
                            key={String(v)}
                            type="button"
                            onClick={() => update(current.id, "yes_no_value", v)}
                            className={`flex-1 sm:flex-none sm:min-w-[140px] py-4 px-6 rounded-2xl border-2 font-serif text-2xl italic transition-all ${
                              values[current.id]?.yes_no_value === v
                                ? "border-destructive bg-destructive/10 text-destructive shadow-glow-primary-lg"
                                : "border-border/60 hover:border-destructive/40"
                            }`}
                          >
                            {v ? "Yes" : "No"}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Optional explanation"
                        value={values[current.id]?.comment ?? ""}
                        onChange={(e) => update(current.id, "comment", e.target.value)}
                        className="bg-transparent border-0 border-b border-border/60 rounded-none px-0 focus-visible:ring-0 focus-visible:border-destructive"
                      />
                    </div>
                  )}
                  {current.input_type === "applicable_na" && (
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { v: "applicable", label: "Applicable" },
                        { v: "not_applicable", label: "Not applicable" },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          type="button"
                          onClick={() => update(current.id, "applicable_status", opt.v)}
                          className={`py-4 px-6 rounded-2xl border-2 font-serif italic text-xl transition-all ${
                            values[current.id]?.applicable_status === opt.v
                              ? "border-destructive bg-destructive/10 text-destructive shadow-glow-primary-lg"
                              : "border-border/60 hover:border-destructive/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 pl-0 sm:pl-16">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFocusIdx((i) => Math.max(0, i - 1))}
                    disabled={focusIdx === 0}
                    className="gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </Button>
                  {focusIdx < reqs.length - 1 ? (
                    <Button size="sm" onClick={() => setFocusIdx((i) => i + 1)} className="gap-1 ml-auto rounded-full">
                      Next question <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground italic ml-auto">Last question — save to continue</span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </main>

      {/* Sticky bottom progress bar */}
      <div className="fixed bottom-0 inset-x-0 z-20 border-t border-border/40 bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Category progress</span>
              <span className="text-xs tabular-nums font-medium">{answeredCount} / {reqs.length}</span>
            </div>
            <div className="h-1 bg-border/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-destructive"
                initial={false}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => saveAll(false)} disabled={busy}>
            <Save className="h-4 w-4" /> Save
          </Button>
          <Button size="sm" className="gap-2 rounded-full" onClick={() => saveAll(true)} disabled={busy}>
            {nextCode ? `Continue → ${nextCode}` : "Continue to documents"} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
