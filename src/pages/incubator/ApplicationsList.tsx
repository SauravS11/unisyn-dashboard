import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, FilePlus2, Rocket, Calendar, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { APPLICATION_STATUS_LABELS } from "@/lib/fundingWorkflows";
import { toast } from "sonner";

interface Row {
  id: string;
  application_code: string;
  business_name: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  request_sent_at: string | null;
  funding_workflows: { name: string; slug: string } | null;
}

const GROUPS: { id: string; label: string; statuses: string[] }[] = [
  { id: "draft", label: "Drafts", statuses: ["draft"] },
  { id: "live", label: "Awaiting Applicant", statuses: ["request_sent", "in_progress", "clarification_requested"] },
  { id: "review", label: "In Review", statuses: ["submitted_for_review", "in_review"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
];

const ApplicationsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, application_code, business_name, status, due_date, updated_at, request_sent_at, funding_workflows(name, slug)")
        .order("updated_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const open = (r: Row) => {
    // Nothing goes to the review dashboard until the applicant request (link + code) has been sent.
    if (r.status === "draft") return navigate(`/incubator/applications/${r.id}/checklist`);
    if (!r.request_sent_at) return navigate(`/incubator/applications/${r.id}/send`);
    navigate(`/incubator/applications/${r.id}/review`);
  };

  const card = (r: Row) => (
    <Card
      key={r.id}
      onClick={() => open(r)}
      className="cursor-pointer glass-surface lift-hover border-primary/20"
    >
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <GlassIcon icon={Rocket} size="lg" />
          <Badge variant="outline" className="rounded-full text-[10px] uppercase tracking-wider">
            {APPLICATION_STATUS_LABELS[r.status] ?? r.status}
          </Badge>
        </div>
        <div>
          <CardTitle className="font-display text-xl leading-tight">{r.business_name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{r.funding_workflows?.name ?? "Funding programme"}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Hash className="h-3.5 w-3.5" /> {r.application_code}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> {r.due_date ? new Date(r.due_date).toLocaleDateString() : "No due date"}
        </span>
      </CardContent>
    </Card>
  );

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between gap-3 mb-8">
          <Button variant="ghost" className="rounded-full gap-2" onClick={() => navigate("/incubator")}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <Button className="rounded-full gap-2" onClick={() => navigate("/incubator/applications/new")}>
            <FilePlus2 className="h-4 w-4" /> New Application
          </Button>
        </div>

        <h1 className="font-display text-4xl tracking-tight mb-2">Your Applications</h1>
        <p className="text-muted-foreground mb-8">Funding applications across all seven programme workflows.</p>

        <Tabs defaultValue="live">
          <TabsList className="glass-surface rounded-full p-1.5 mb-6 flex-wrap h-auto">
            {GROUPS.map((g) => (
              <TabsTrigger key={g.id} value={g.id} className="rounded-full text-xs sm:text-sm">
                {g.label} ({rows.filter((r) => g.statuses.includes(r.status)).length})
              </TabsTrigger>
            ))}
          </TabsList>
          {GROUPS.map((g) => {
            const list = rows.filter((r) => g.statuses.includes(r.status));
            return (
              <TabsContent key={g.id} value={g.id}>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : list.length === 0 ? (
                  <div className="glass-surface p-10 text-center text-sm text-muted-foreground">
                    Nothing here yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{list.map(card)}</div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </PageShell>
  );
};

export default ApplicationsList;
