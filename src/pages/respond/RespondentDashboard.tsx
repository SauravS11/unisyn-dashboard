import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { ArrowRight, Calendar } from "lucide-react";

interface CategoryCard {
  code: string;
  name: string;
  total: number;
  part1: { total: number; done: number };
  part2: { total: number; done: number };
  status: string;
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
      const [{ data: i }, { data: selected }, { data: reqs }, { data: resps }, { data: docs }, { data: catMeta }] = await Promise.all([
        (supabase as any).from("client_intakes").select("intake_code, company_name, due_date, status").eq("id", intakeId).single(),
        (supabase as any).from("client_intake_categories").select("category_id, status").eq("client_intake_id", intakeId),
        (supabase as any).from("due_diligence_requirements").select("id, category_id, input_type"),
        (supabase as any).from("client_requirement_responses").select("requirement_id, category_id").eq("client_intake_id", intakeId),
        (supabase as any).from("client_requirement_documents").select("requirement_id, category_id").eq("client_intake_id", intakeId),
        (supabase as any).from("due_diligence_categories").select("id, category_code, category_name, display_order").order("display_order"),
      ]);

      const catById: Record<string, any> = {};
      (catMeta ?? []).forEach((c: any) => { catById[c.id] = c; });

      const result: CategoryCard[] = (selected ?? []).map((s: any) => {
        const meta = catById[s.category_id];
        const part1Reqs = (reqs ?? []).filter((r: any) => r.category_id === s.category_id && (r.input_type === "written_response" || r.input_type === "yes_no" || r.input_type === "applicable_na"));
        const part2Reqs = (reqs ?? []).filter((r: any) => r.category_id === s.category_id && (r.input_type === "document_upload" || r.input_type === "document_upload_with_comment"));
        const respIds = new Set((resps ?? []).filter((r: any) => r.category_id === s.category_id).map((r: any) => r.requirement_id));
        const docIds = new Set((docs ?? []).filter((d: any) => d.category_id === s.category_id).map((d: any) => d.requirement_id));
        return {
          code: meta?.category_code ?? "",
          name: meta?.category_name ?? "",
          total: part1Reqs.length + part2Reqs.length,
          part1: { total: part1Reqs.length, done: part1Reqs.filter((r: any) => respIds.has(r.id)).length },
          part2: { total: part2Reqs.length, done: part2Reqs.filter((r: any) => docIds.has(r.id)).length },
          status: s.status,
        };
      }).sort((a, b) => a.code.localeCompare(b.code));

      setIntake(i);
      setCats(result);
      setLoading(false);
    })();
  }, [intakeId, navigate]);

  const overall = useMemo(() => {
    if (cats.length === 0) return 0;
    const sum = cats.reduce((acc, c) => acc + (c.total ? (c.part1.done + c.part2.done) / c.total : 0), 0);
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

        <div className="grid md:grid-cols-2 gap-4">
          {cats.map((c) => {
            const pct = c.total ? Math.round(((c.part1.done + c.part2.done) / c.total) * 100) : 0;
            const missing = Math.max(0, c.total - c.part1.done - c.part2.done);
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
                      <p className="font-semibold">{c.part1.done}/{c.part1.total}</p>
                    </div>
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-muted-foreground">Part 2 · Documents</p>
                      <p className="font-semibold">{c.part2.done}/{c.part2.total}</p>
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
