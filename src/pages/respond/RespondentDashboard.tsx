import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, clearIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { ArrowRight, CalendarDays, CheckCircle2, FileStack, ClipboardList, Layers } from "lucide-react";
import { toast } from "sonner";

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
      const list: CategoryRow[] = (payload?.categories ?? []).map((c: any) => ({
        category_id: c.category_id,
        code: c.category_code,
        name: c.category_name,
        status: c.status,
        part1_total: c.part1_total ?? 0,
        part1_done: c.part1_done ?? 0,
        part2_total: c.part2_total ?? 0,
        part2_done: c.part2_done ?? 0,
      }));
      setCats(list);
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
    ? "Begin Due Diligence Questionnaire"
    : !part2AllDone
      ? "Continue to Document Uploads"
      : "Review & Finish";

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        {/* Hero greeting */}
        <div className="text-center mb-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Pre-Due Diligence</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">
            {intake?.company_name ?? "Your"} <span className="text-gradient-brand">intake</span>
          </h1>
        </div>

        {/* Stat tiles */}
        <div className="grid sm:grid-cols-3 gap-4">
          <StatTile icon={Layers} label="Overall completion">
            <div className="flex items-baseline gap-2">
              <p className="font-display text-4xl tracking-tight">{overall}%</p>
            </div>
            <Progress value={overall} className="h-1.5 mt-2" />
          </StatTile>
          <StatTile icon={FileStack} label="Categories">
            <p className="font-display text-4xl tracking-tight">{cats.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {cats.filter((c) => c.status === "approved").length} approved
            </p>
          </StatTile>
          <StatTile icon={CalendarDays} label="Due date">
            <p className="font-display text-2xl tracking-tight">
              {intake?.due_date ? new Date(intake.due_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}
            </p>
          </StatTile>
        </div>

        {cats.length === 0 ? (
          <Card className="glass-surface">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Your advisor hasn't assigned any categories yet. Please check back shortly.
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-surface-strong overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-2xl tracking-tight">Due Diligence Questionnaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                You'll move through {cats.length} {cats.length === 1 ? "category" : "categories"} in two stages —
                written responses first (Part 1), then supporting documents (Part 2). Progress saves automatically.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <StageCard
                  icon={ClipboardList}
                  title="Stage 1 · Responses"
                  done={part1AllDone}
                  detail={`${cats.reduce((a, c) => a + c.part1_done, 0)} / ${cats.reduce((a, c) => a + c.part1_total, 0)} answered`}
                />
                <StageCard
                  icon={FileStack}
                  title="Stage 2 · Documents"
                  done={part2AllDone}
                  detail={`${cats.reduce((a, c) => a + c.part2_done, 0)} / ${cats.reduce((a, c) => a + c.part2_total, 0)} uploaded`}
                />
              </div>

              <Button size="lg" className="w-full gap-2 h-14 text-base font-semibold rounded-xl shadow-glow-primary-lg" onClick={startFlow}>
                {ctaLabel} <ArrowRight className="h-5 w-5" />
              </Button>

              <details className="text-xs text-muted-foreground group">
                <summary className="cursor-pointer hover:text-foreground select-none flex items-center gap-1.5 font-medium">
                  <span className="transition-transform group-open:rotate-90 inline-block">›</span>
                  View category checklist
                </summary>
                <ul className="mt-3 space-y-1.5 pl-4">
                  {cats.map((c) => {
                    const total = c.part1_total + c.part2_total;
                    const done = c.part1_done + c.part2_done;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <li key={c.code} className="flex items-center gap-3 py-1">
                        <span className="font-mono font-bold text-primary tabular-nums w-6 text-xs">{c.code}</span>
                        <span className="flex-1 truncate text-foreground/80">{c.name}</span>
                        <Badge variant={pct === 100 ? "default" : "secondary"} className="text-[10px] rounded-full">{pct}%</Badge>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </CardContent>
          </Card>
        )}
      </main>
    </PageShell>
  );
}

const StatTile = ({ icon, label, children }: { icon: any; label: string; children: React.ReactNode }) => (
  <Card className="glass-surface">
    <CardContent className="p-4">
      <div className="flex items-center gap-2.5 mb-2">
        <GlassIcon icon={icon} size="sm" />
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      </div>
      {children}
    </CardContent>
  </Card>
);

const StageCard = ({ icon, title, done, detail }: { icon: any; title: string; done: boolean; detail: string }) => (
  <div className="relative rounded-2xl border border-border/50 bg-card/40 backdrop-glass p-4 lift-hover">
    <div className="flex items-center gap-2.5 mb-2">
      <GlassIcon icon={icon} size="sm" />
      <p className="font-semibold text-sm">{title}</p>
      {done && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
    </div>
    <p className="text-xs text-muted-foreground pl-[44px]">{detail}</p>
  </div>
);
