import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, ShieldAlert, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { supabase as cloudSupabase } from "@/integrations/supabase/client";

type Item = { category: string; text: string };
type State = { loading: boolean; error: string | null; missing: Item[]; risks: Item[] };

export const MiaInsights = ({ title = "MIA Insights", intakeId }: { title?: string; intakeId?: string }) => {
  const [state, setState] = useState<State>({ loading: false, error: null, missing: [], risks: [] });

  const run = async () => {
    if (!intakeId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [{ data: cats }, { data: reqs }, { data: resps }, { data: docs }] = await Promise.all([
        (supabase as any).from("due_diligence_categories").select("id, category_code, category_name"),
        (supabase as any).from("due_diligence_requirements").select("id, category_id, requirement_code, requirement_text, input_type, is_required"),
        (supabase as any).from("client_requirement_responses").select("requirement_id, category_id, response_value, yes_no_value, applicable_status, comment, status").eq("client_intake_id", intakeId),
        (supabase as any).from("client_requirement_documents").select("requirement_id, category_id, file_name, status, rejection_reason").eq("client_intake_id", intakeId),
      ]);

      const catMap: Record<string, any> = {};
      (cats ?? []).forEach((c: any) => {
        catMap[c.id] = c;
      });

      const checklistData = (reqs ?? []).map((r: any) => {
        const resp = (resps ?? []).find((x: any) => x.requirement_id === r.id);
        const reqDocs = (docs ?? []).filter((d: any) => d.requirement_id === r.id);

        return {
          category: [catMap[r.category_id]?.category_code, catMap[r.category_id]?.category_name].filter(Boolean).join(" "),
          requirement: r.requirement_text,
          input_type: r.input_type,
          is_required: r.is_required,
          response: resp
            ? {
                value: resp.response_value,
                yes_no: resp.yes_no_value,
                applicable: resp.applicable_status,
                comment: resp.comment,
                status: resp.status,
              }
            : null,
          documents: reqDocs.map((d: any) => ({
            name: d.file_name,
            status: d.status,
            rejection_reason: d.rejection_reason,
          })),
        };
      });

      const { data, error } = await (cloudSupabase as any).functions.invoke("mia-insights", {
        body: { intakeId, checklistData },
      });
      if (error) throw error;
      setState({
        loading: false,
        error: null,
        missing: (data?.missing_info ?? []).map((x: any) => ({ category: x.category ?? "", text: x.issue ?? "" })),
        risks: (data?.risks ?? []).map((x: any) => ({ category: x.category ?? "", text: x.risk ?? "" })),
      });
    } catch (e: any) {
      setState({ loading: false, error: e?.message ?? "Failed to analyze", missing: [], risks: [] });
    }
  };

  useEffect(() => { if (intakeId) run(); /* eslint-disable-next-line */ }, [intakeId]);

  const Section = ({ icon: Icon, label, items, empty }: { icon: any; label: string; items: Item[]; empty: string }) => (
    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-sm font-medium">{label}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="text-xs">
              {it.category && <span className="font-semibold text-destructive">{it.category}: </span>}
              <span className="text-foreground/80">{it.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        {intakeId && (
          <Button variant="ghost" size="sm" onClick={run} disabled={state.loading} className="gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${state.loading ? "animate-spin" : ""}`} />
            <span className="text-xs">{state.loading ? "Analyzing" : "Refresh"}</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!intakeId && (
          <p className="text-xs text-muted-foreground">MIA will appear once an intake is loaded.</p>
        )}
        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        {intakeId && (
          <>
            <Section icon={AlertCircle} label="Missing information flags" items={state.missing}
              empty={state.loading ? "Scanning checklist…" : "No missing required items detected."} />
            <Section icon={ShieldAlert} label="Risk notes" items={state.risks}
              empty={state.loading ? "Scanning responses & documents…" : "No risk flags detected."} />
          </>
        )}
      </CardContent>
    </Card>
  );
};
