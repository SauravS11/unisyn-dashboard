import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { portalSupabase as supabase } from "@/integrations/supabase/portalClient";
import { getIntakeSession, clearIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { PageShell } from "@/components/ui/page-shell";
import { ChevronRight, ClipboardList, FileText } from "lucide-react";
import { ApplicantProgress } from "@/components/ApplicantProgress";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Badge } from "@/components/ui/badge";
import { getProgressColors } from "@/lib/progressColors";
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

  const totalAll = cats.reduce((a, c) => a + c.part1_total + c.part2_total, 0);
  const totalDone = cats.reduce((a, c) => a + c.part1_done + c.part2_done, 0);

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
      <RespondentHeader intakeCode={intake?.intake_code} companyName={intake?.company_name} showProgress={false} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Requirements Completed", value: `${totalDone} of ${totalAll}` },
            { label: "Categories", value: cats.length },
            { label: "Approved", value: cats.filter((c) => c.status === "approved").length },
            {
              label: "Due Date",
              value: intake?.due_date ? new Date(intake.due_date).toLocaleDateString() : "—",
            },
          ].map((m) => (
            <div key={m.label} className="glass-surface p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="font-semibold mt-1 text-sm sm:text-base">{m.value}</p>
            </div>
          ))}
        </div>

        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Welcome to your pre-due diligence</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">
            Let’s complete the <span className="text-gradient-brand">{intake?.company_name ?? "deal"}</span> intake.
          </h1>
          <p className="text-muted-foreground mt-4">
            A simple, guided process: answer the written questions for each category, then upload the supporting documents.
          </p>
          <ApplicantProgress completion={overall} done={totalDone} total={totalAll} />
          <Button className="rounded-full mt-6 gap-2" size="lg" onClick={startFlow} disabled={!ctaTarget}>
            {totalDone > 0 ? ctaLabel : "Start the process"} <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">Part 1 · Written responses &nbsp;·&nbsp; Part 2 · Documents</p>
        </div>

        <h2 className="font-display text-2xl mb-4">Categories</h2>
        {cats.length === 0 ? (
          <p className="text-sm text-muted-foreground">Your advisor hasn't assigned any categories yet.</p>
        ) : (
          <div className="space-y-3">
            {cats.map((c) => {
              const total = c.part1_total + c.part2_total;
              const done = c.part1_done + c.part2_done;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const colors = getProgressColors(pct);
              const part = c.part1_total > 0 && c.part1_done < c.part1_total ? 1 : c.part2_total > 0 && c.part2_done < c.part2_total ? 2 : 1;
              return (
                <button
                  key={c.code}
                  onClick={() => navigate(`/respond/${intakeId}/category/${c.code}/part-${part}`)}
                  className="w-full glass-surface lift-hover p-5 flex items-center gap-4 text-left"
                >
                  <GlassIcon icon={c.part1_total === 0 ? FileText : ClipboardList} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-lg leading-tight">{c.code} — {c.name}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={pct} className="h-1.5 max-w-xs" />
                      <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{pct}%</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full shrink-0">
                    {STATUS_LABELS[c.status] ?? c.status}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        <div className="glass-surface p-4 mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>You can save your progress at any time. Your responses are securely saved as you go.</span>
          <span>Need help? Contact your advisor.</span>
        </div>
      </div>
    </PageShell>
  );
}

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Needs Update",
  denied: "Needs Update",
};
