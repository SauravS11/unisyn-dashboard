import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, clearIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { PageShell } from "@/components/ui/page-shell";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, FileStack } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface CategoryRow {
  category_id: string;
  code: string;
  name: string;
  status: string;
  part1_total: number;
  part1_done: number;
  part2_total: number;
  part2_done: number;
}

export default function RespondentDashboard() {
  const { intakeId } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake] = useState<any>(null);
  const [cats, setCats] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getIntakeSession();
    if (!session.accessToken || session.intakeId !== intakeId) {
      navigate("/respond");
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("get_intake_overview", {
        p_intake_id: intakeId,
        p_token: session.accessToken,
      });
      if (error) {
        toast.error("Session expired — please re-enter your code");
        clearIntakeSession();
        navigate("/respond");
        return;
      }
      const payload = data as any;
      setIntake(payload?.intake ?? null);
      setCats((payload?.categories ?? []).map((c: any) => ({
        category_id: c.category_id,
        code: c.category_code,
        name: c.category_name,
        status: c.status,
        part1_total: c.part1_total ?? 0,
        part1_done: c.part1_done ?? 0,
        part2_total: c.part2_total ?? 0,
        part2_done: c.part2_done ?? 0,
      })));
      setLoading(false);
    })();
  }, [intakeId, navigate]);

  const overall = useMemo(() => {
    if (cats.length === 0) return 0;
    const sum = cats.reduce((acc, c) => {
      const total = c.part1_total + c.part2_total;
      return acc + (total ? (c.part1_done + c.part2_done) / total : 0);
    }, 0);
    return Math.round((sum / cats.length) * 100);
  }, [cats]);

  const part1AllDone = cats.length > 0 && cats.every((c) => c.part1_total === 0 || c.part1_done >= c.part1_total);
  const part2AllDone = cats.length > 0 && cats.every((c) => c.part2_total === 0 || c.part2_done >= c.part2_total);

  const ctaTarget = useMemo(() => {
    if (cats.length === 0) return null;
    const nextP1 = cats.find((c) => c.part1_total > 0 && c.part1_done < c.part1_total);
    if (nextP1) return { code: nextP1.code, part: 1 as const };
    const nextP2 = cats.find((c) => c.part2_total > 0 && c.part2_done < c.part2_total);
    if (nextP2) return { code: nextP2.code, part: 2 as const };
    return { code: cats[0].code, part: 1 as const };
  }, [cats]);

  const ctaLabel = !part1AllDone
    ? "Begin written responses"
    : !part2AllDone
      ? "Continue to documents"
      : "Review & finish";

  const startFlow = () => {
    if (!ctaTarget) return;
    navigate(`/respond/${intakeId}/category/${ctaTarget.code}/part-${ctaTarget.part}`);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <RespondentHeader intakeCode={intake?.intake_code} companyName={intake?.company_name} completion={overall} />

      {/* Thin metric ribbon */}
      <div className="border-b border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Ribbon label="Completion" value={`${overall}%`} />
          <Ribbon label="Categories" value={String(cats.length)} />
          <Ribbon label="Approved" value={String(cats.filter((c) => c.status === "approved").length)} />
          <Ribbon label="Due" value={intake?.due_date ? new Date(intake.due_date).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "—"} icon={CalendarDays} />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-[1.05fr_1fr] gap-16">
        {/* LEFT — Editorial hero */}
        <section className="space-y-10">
          <div className="space-y-6">
            <p className="text-[11px] uppercase tracking-[0.32em] text-destructive font-semibold">Pre-Due Diligence</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight">
              {intake?.company_name ?? "Your"}<span className="italic text-destructive/90">.</span>
              <span className="block text-muted-foreground/70 italic text-3xl sm:text-4xl mt-3">
                a guided intake in two acts.
              </span>
            </h1>
            <p className="text-base text-foreground/70 leading-relaxed max-w-lg">
              You'll move through {cats.length} {cats.length === 1 ? "category" : "categories"} — first answering written
              questions, then attaching the supporting documents. Progress autosaves.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button size="lg" onClick={startFlow}
              className="gap-2 h-14 px-7 text-base font-semibold rounded-full shadow-glow-primary-lg">
              {ctaLabel} <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p><span className={part1AllDone ? "text-destructive font-semibold" : ""}>Act I</span> · responses</p>
              <p><span className={part2AllDone ? "text-destructive font-semibold" : ""}>Act II</span> · documents</p>
            </div>
          </div>

          {/* Two horizontal progress bars under the CTA */}
          <div className="space-y-4 pt-2 max-w-md">
            <ActBar
              icon={ClipboardList}
              title="Act I — Responses"
              done={cats.reduce((a, c) => a + c.part1_done, 0)}
              total={cats.reduce((a, c) => a + c.part1_total, 0)}
              complete={part1AllDone}
            />
            <ActBar
              icon={FileStack}
              title="Act II — Documents"
              done={cats.reduce((a, c) => a + c.part2_done, 0)}
              total={cats.reduce((a, c) => a + c.part2_total, 0)}
              complete={part2AllDone}
            />
          </div>
        </section>

        {/* RIGHT — Magazine index */}
        <aside className="lg:border-l lg:border-border/40 lg:pl-12">
          <div className="flex items-baseline justify-between mb-6">
            <h2 className="font-serif text-2xl italic">Index</h2>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {cats.length} categories
            </span>
          </div>
          {cats.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Your advisor hasn't assigned any categories yet.
            </p>
          ) : (
            <ol className="divide-y divide-border/40">
              {cats.map((c, i) => {
                const total = c.part1_total + c.part2_total;
                const done = c.part1_done + c.part2_done;
                const pct = total ? Math.round((done / total) * 100) : 0;
                return (
                  <motion.li
                    key={c.code}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      onClick={() => navigate(`/respond/${intakeId}/category/${c.code}/part-1`)}
                      className="group w-full flex items-center gap-5 py-4 text-left hover:bg-card/40 -mx-3 px-3 rounded-md transition-colors"
                    >
                      <span className="font-serif text-3xl text-destructive/90 tabular-nums w-10 italic">{c.code}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-foreground">{c.name}</p>
                        <div className="mt-1.5 h-px bg-border/40 relative">
                          <div className="absolute inset-y-0 left-0 bg-destructive" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground tabular-nums w-10 text-right">
                        {pct === 100 ? <CheckCircle2 className="h-4 w-4 text-destructive ml-auto" /> : `${pct}%`}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </aside>
      </main>
    </PageShell>
  );
}

const Ribbon = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
  <div className="flex items-center gap-2">
    {Icon && <Icon className="h-3 w-3 text-destructive" />}
    <span>{label}</span>
    <span className="text-foreground font-semibold tracking-normal normal-case text-sm ml-auto sm:ml-0">{value}</span>
  </div>
);

const ActBar = ({ icon: Icon, title, done, total, complete }: { icon: any; title: string; done: number; total: number; complete: boolean }) => {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-destructive" />
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold">{title}</p>
        {complete && <CheckCircle2 className="h-3.5 w-3.5 text-destructive ml-auto" />}
        <span className="text-xs text-muted-foreground tabular-nums ml-auto">{done}/{total}</span>
      </div>
      <Progress value={pct} className="h-1" />
    </div>
  );
};
