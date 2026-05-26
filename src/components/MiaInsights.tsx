import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle, ShieldAlert, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";

type Item = { category: string; text: string };
type State = { loading: boolean; error: string | null; missing: Item[]; risks: Item[] };

export const MiaInsights = ({ title = "MIA Insights", intakeId }: { title?: string; intakeId?: string }) => {
  const [state, setState] = useState<State>({ loading: false, error: null, missing: [], risks: [] });

  const run = async () => {
    if (!intakeId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, error } = await (supabase as any).functions.invoke("mia-insights", { body: { intakeId } });
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
