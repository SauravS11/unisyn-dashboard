import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, submitResponse } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";

interface Req {
  id: string;
  requirement_code: string;
  requirement_text: string;
  input_type: "written_response" | "yes_no" | "applicable_na";
}

export default function CategoryPart1() {
  const { intakeId, categoryCode } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [values, setValues] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = getIntakeSession();
    if (!session.accessToken || session.intakeId !== intakeId) { navigate("/respond"); return; }
    (async () => {
      const { data: i } = await (supabase as any).from("client_intakes").select("intake_code, company_name").eq("id", intakeId).single();
      const { data: cat } = await (supabase as any).from("due_diligence_categories").select("*").eq("category_code", categoryCode).single();
      setIntake(i); setCategory(cat);
      const { data: r } = await (supabase as any)
        .from("due_diligence_requirements")
        .select("id, requirement_code, requirement_text, input_type, display_order")
        .eq("category_id", cat.id)
        .in("input_type", ["written_response", "yes_no", "applicable_na"])
        .order("display_order");
      setReqs(r ?? []);
      const { data: existing } = await (supabase as any)
        .from("client_requirement_responses")
        .select("*")
        .eq("client_intake_id", intakeId)
        .eq("category_id", cat.id);
      const v: Record<string, any> = {};
      (existing ?? []).forEach((e: any) => {
        v[e.requirement_id] = {
          response_value: e.response_value ?? "",
          yes_no_value: e.yes_no_value,
          applicable_status: e.applicable_status,
          comment: e.comment ?? "",
        };
      });
      setValues(v);
    })();
  }, [intakeId, categoryCode, navigate]);

  const update = (id: string, key: string, val: any) =>
    setValues((s) => ({ ...s, [id]: { ...(s[id] ?? {}), [key]: val } }));

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
      if (goNext) navigate(`/respond/${intakeId}/category/${categoryCode}/part-2`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <RespondentHeader intakeCode={intake?.intake_code} companyName={intake?.company_name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/respond/${intakeId}`)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to categories
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">
              <span className="text-destructive font-bold mr-2">{categoryCode}</span>
              {category?.category_name} — Part 1: Responses &amp; Confirmations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {reqs.length === 0 && <p className="text-sm text-muted-foreground">No written responses required for this category. Continue to Part 2.</p>}
            {reqs.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-destructive tabular-nums">{r.requirement_code}</span>
                  <p className="font-medium text-sm">{r.requirement_text}</p>
                </div>
                {r.input_type === "written_response" && (
                  <Textarea
                    rows={3}
                    placeholder="Your response…"
                    value={values[r.id]?.response_value ?? ""}
                    onChange={(e) => update(r.id, "response_value", e.target.value)}
                  />
                )}
                {r.input_type === "yes_no" && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={values[r.id]?.yes_no_value === true ? "default" : "outline"}
                        onClick={() => update(r.id, "yes_no_value", true)}
                      >Yes</Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={values[r.id]?.yes_no_value === false ? "default" : "outline"}
                        onClick={() => update(r.id, "yes_no_value", false)}
                      >No</Button>
                    </div>
                    <Input
                      placeholder="Optional explanation"
                      value={values[r.id]?.comment ?? ""}
                      onChange={(e) => update(r.id, "comment", e.target.value)}
                    />
                  </div>
                )}
                {r.input_type === "applicable_na" && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={values[r.id]?.applicable_status === "applicable" ? "default" : "outline"}
                      onClick={() => update(r.id, "applicable_status", "applicable")}
                    >Applicable</Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={values[r.id]?.applicable_status === "not_applicable" ? "default" : "outline"}
                      onClick={() => update(r.id, "applicable_status", "not_applicable")}
                    >Not Applicable</Button>
                  </div>
                )}
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="gap-2" onClick={() => saveAll(false)} disabled={busy}>
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button className="gap-2 sm:ml-auto" onClick={() => saveAll(true)} disabled={busy}>
                Continue to Part 2 <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
