import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, clearIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";

interface CategoryCard {
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
  const [cats, setCats] = useState<CategoryCard[]>([]);
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
      const list: CategoryCard[] = (payload?.categories ?? []).map((c: any) => ({
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <RespondentHeader intakeCode={intake?.intake_code} companyName={intake?.company_name} completion={overall} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
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

        {cats.length === 0 && (
          <Card className="backdrop-blur-xl bg-card/60 border-border/50">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Your advisor hasn't assigned any categories yet. Please check back shortly.
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {cats.map((c) => {
            const total = c.part1_total + c.part2_total;
            const done = c.part1_done + c.part2_done;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const missing = Math.max(0, total - done);
            return (
              <Card key={c.code} className="backdrop-blur-xl bg-card/60 border-border/50 hover:shadow-xl hover:border-primary/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      <span className="text-destructive font-bold mr-2">{c.code}</span>
                      {c.name}
                    </CardTitle>
                    <Badge variant={c.status === "approved" ? "default" : c.status === "changes_requested" ? "destructive" : "secondary"} className="text-xs whitespace-nowrap">
                      {c.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium tabular-nums">{pct}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Part 1 · Responses</p>
                      <p className="font-semibold">{c.part1_done}/{c.part1_total}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Part 2 · Documents</p>
                      <p className="font-semibold">{c.part2_done}/{c.part2_total}</p>
                    </div>
                  </div>
                  {missing > 0 && <p className="text-xs text-destructive">{missing} items remaining</p>}
                  <Button className="w-full gap-2" onClick={() => navigate(`/respond/${intakeId}/category/${c.code}/part-1`)}>
                    Open Category <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
