import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, clearIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { ArrowRight, Calendar, CheckCircle2, FileText, ClipboardList } from "lucide-react";
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
    // Resume at first incomplete Part 1, else first incomplete Part 2, else first category Part 1.
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <RespondentHeader intakeCode={intake?.intake_code} companyName={intake?.company_name} completion={overall} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Overall Completion</p>
              <p className="text-3xl font-bold mt-1">{overall}%</p>
              <Progress value={overall} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Categories</p>
              <p className="text-3xl font-bold mt-1">{cats.length}</p>
              <p className="text-xs text-muted-foreground mt-2">{cats.filter((c) => c.status === "approved").length} approved</p>
            </CardContent>
          </Card>
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Due Date</p>
              <p className="text-lg font-semibold mt-1">{intake?.due_date ? new Date(intake.due_date).toLocaleDateString() : "—"}</p>
            </CardContent>
          </Card>
        </div>

        {cats.length === 0 ? (
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Your advisor hasn't assigned any categories yet. Please check back shortly.
            </CardContent>
          </Card>
        ) : (
          <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Due Diligence Questionnaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm text-muted-foreground">
                You'll be guided through {cats.length} {cats.length === 1 ? "category" : "categories"} in two stages:
                first answering all written questions and confirmations (Part 1), then uploading supporting documents
                for each category (Part 2). Your progress is saved automatically after every step.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-card/40 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ClipboardList className="h-4 w-4 text-destructive" />
                    <p className="font-semibold text-sm">Stage 1 · Responses</p>
                    {part1AllDone && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cats.reduce((a, c) => a + c.part1_done, 0)} / {cats.reduce((a, c) => a + c.part1_total, 0)} questions answered
                  </p>
                </div>
                <div className="rounded-lg border border-border/50 bg-card/40 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-destructive" />
                    <p className="font-semibold text-sm">Stage 2 · Documents</p>
                    {part2AllDone && <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {cats.reduce((a, c) => a + c.part2_done, 0)} / {cats.reduce((a, c) => a + c.part2_total, 0)} documents uploaded
                  </p>
                </div>
              </div>

              <Button size="lg" className="w-full gap-2 h-12 text-base" onClick={startFlow}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Button>

              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer hover:text-foreground">View category checklist</summary>
                <ul className="mt-3 space-y-1.5">
                  {cats.map((c) => {
                    const total = c.part1_total + c.part2_total;
                    const done = c.part1_done + c.part2_done;
                    const pct = total ? Math.round((done / total) * 100) : 0;
                    return (
                      <li key={c.code} className="flex items-center gap-2">
                        <span className="font-bold text-destructive tabular-nums w-6">{c.code}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <Badge variant={pct === 100 ? "default" : "secondary"} className="text-[10px]">{pct}%</Badge>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
