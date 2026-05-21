import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface Cat {
  id: string;
  category_code: string;
  category_name: string;
  display_order: number;
  count: number;
}

export default function IntakeCategories() {
  const { intakeId } = useParams();
  const navigate = useNavigate();
  const [cats, setCats] = useState<Cat[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: catData } = await (supabase as any)
        .from("due_diligence_categories")
        .select("id, category_code, category_name, display_order")
        .eq("is_active", true)
        .order("display_order");
      const { data: reqData } = await (supabase as any)
        .from("due_diligence_requirements")
        .select("category_id");
      const counts: Record<string, number> = {};
      (reqData ?? []).forEach((r: any) => { counts[r.category_id] = (counts[r.category_id] ?? 0) + 1; });
      const result: Cat[] = (catData ?? []).map((c: any) => ({ ...c, count: counts[c.id] ?? 0 }));
      setCats(result);

      const { data: existing } = await (supabase as any)
        .from("client_intake_categories")
        .select("category_id, advisor_notes")
        .eq("client_intake_id", intakeId);
      const sel: Record<string, boolean> = {};
      const ns: Record<string, string> = {};
      (existing ?? []).forEach((e: any) => { sel[e.category_id] = true; if (e.advisor_notes) ns[e.category_id] = e.advisor_notes; });
      setSelected(sel);
      setNotes(ns);
      setLoading(false);
    })();
  }, [intakeId]);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const save = async (continueNext: boolean) => {
    setSaving(true);
    try {
      const chosen = cats.filter((c) => selected[c.id]);
      if (continueNext && chosen.length === 0) {
        toast.error("Select at least one category");
        return;
      }
      // Wipe + re-insert (simple, idempotent)
      await (supabase as any).from("client_intake_categories").delete().eq("client_intake_id", intakeId);
      if (chosen.length > 0) {
        const rows = chosen.map((c) => ({
          client_intake_id: intakeId,
          category_id: c.id,
          advisor_notes: notes[c.id] ?? null,
        }));
        const { error } = await (supabase as any).from("client_intake_categories").insert(rows);
        if (error) throw error;
      }
      toast.success("Categories saved");
      if (continueNext) navigate(`/onboarding/${intakeId}/send`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-10 px-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/onboarding/new`)} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Select Due Diligence Categories</CardTitle>
            <CardDescription>Step 2 of 3 — Pick which A–N workstreams the respondent must complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cats.map((c) => (
              <div key={c.id} className={`rounded-lg border p-4 transition-colors ${selected[c.id] ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/40"}`}>
                <div className="flex items-start gap-3">
                  <Checkbox checked={!!selected[c.id]} onCheckedChange={() => toggle(c.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-destructive tabular-nums">{c.category_code}</span>
                      <h3 className="font-semibold">{c.category_name}</h3>
                      <span className="ml-auto text-xs text-muted-foreground">{c.count} requirements</span>
                    </div>
                    {selected[c.id] && (
                      <Textarea
                        placeholder="Optional advisor notes for this category"
                        className="mt-3"
                        rows={2}
                        value={notes[c.id] ?? ""}
                        onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={() => save(false)} disabled={saving} className="gap-2">
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={() => save(true)} disabled={saving} className="gap-2 sm:ml-auto">
                Continue to Request <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
