import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listTab } from "@/lib/workspaceListNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Plus, Calendar, Clock, Trash2, ChevronRight, Inbox, Hourglass, Briefcase, CheckCircle2, FolderOpen } from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { PageNavigation } from "@/components/PageNavigation";
import { StatusTabBar, STATUS_CARD_TONES, type StatusTabTone } from "@/components/StatusTabBar";
import { PageHeaderActions } from "@/components/PageHeaderActions";
import { NotificationButton } from "@/components/NotificationButton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/customClient";
import { APPLICATION_STATUS_LABELS, APPROVED_APPLICATION_STATUSES } from "@/lib/fundingWorkflows";
import { toast } from "sonner";

interface Row {
  id: string;
  application_code: string;
  business_name: string;
  status: string;
  due_date: string | null;
  updated_at: string;
  created_at: string;
  request_sent_at: string | null;
  funding_workflows: { name: string; slug: string } | null;
}

const GROUPS = [
  { id: "draft", label: "Drafts", title: "Draft", icon: Inbox, tone: "red" as const, statuses: ["draft"], subtitle: "Funding applications you've started but not yet sent" },
  { id: "live", label: "Awaiting Applicant", title: "Awaiting", icon: Hourglass, tone: "yellow" as const, statuses: ["request_sent", "in_progress", "clarification_requested"], subtitle: "Applications sent to applicants and awaiting their documents" },
  { id: "review", label: "In Review", title: "In Review", icon: Briefcase, tone: "blue" as const, statuses: ["submitted_for_review", "in_review"], subtitle: "Funding applications submitted for review" },
  { id: "approved", label: "Approved", title: "Approved", icon: CheckCircle2, tone: "green" as const, statuses: APPROVED_APPLICATION_STATUSES, subtitle: "Approved funding applications and their workspaces" },
];

const ApplicationsList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = listTab(searchParams, GROUPS.map(g => g.id), "live");
  const setViewMode = (tab: string) => setSearchParams((previous) => {
    const next = new URLSearchParams(previous);
    next.set("tab", tab);
    return next;
  });
  const currentGroup = GROUPS.find((g) => g.id === viewMode) ?? GROUPS[1];

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, application_code, business_name, status, due_date, created_at, updated_at, request_sent_at, funding_workflows(name, slug)")
        .order("updated_at", { ascending: false });
      if (error) toast.error(error.message);
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, []);

  const open = (r: Row) => {
    if (APPROVED_APPLICATION_STATUSES.includes(r.status)) return navigate(`/incubator/applications/${r.id}/review`);
    // Nothing goes to the review dashboard until the applicant request (link + code) has been sent.
    if (r.status === "draft") return navigate(`/incubator/applications/${r.id}/checklist`);
    if (!r.request_sent_at) return navigate(`/incubator/applications/${r.id}/send`);
    navigate(`/incubator/applications/${r.id}/review`);
  };

  const remove = async (r: Row) => {
    if (!window.confirm(`Delete "${r.business_name}" (${r.application_code})? This removes the application and all its responses and documents.`)) return;
    const { data, error } = await supabase.rpc("delete_funding_application", { p_application_id: r.id });
    if (error || data === false) {
      toast.error(error?.message ?? "Could not delete the application");
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    toast.success("Application deleted");
  };

  const card = (r: Row, tone: StatusTabTone) => (
    <Card
      key={r.id}
      onClick={() => open(r)}
      className={`backdrop-blur-xl bg-card/60 border-2 ${STATUS_CARD_TONES[tone].border} shadow-lg hover:shadow-xl motion-safe:hover:-translate-y-1 transition-all duration-300 cursor-pointer group touch-manipulation`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl font-semibold group-hover:text-primary transition-colors flex items-start justify-between gap-2">
          <span className="flex-1 min-w-0 truncate">{r.business_name}</span>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${r.business_name}`}
              title={`Delete ${r.business_name}`}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                remove(r);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={STATUS_CARD_TONES[tone].badge}>
            {APPLICATION_STATUS_LABELS[r.status] ?? r.status}
          </Badge>
          <span className="text-xs font-mono text-primary">{r.application_code}</span>
          <span className="text-xs text-muted-foreground">· {r.funding_workflows?.name ?? "Funding programme"}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2 shrink-0" />
          <span>Created {format(new Date(r.created_at), "MMM dd, yyyy")}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2 shrink-0" />
          <span>{r.due_date ? `Due ${format(new Date(r.due_date), "MMM dd, yyyy")}` : `Updated ${format(new Date(r.updated_at), "MMM dd, yyyy")}`}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="funding-list-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border/20" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#funding-list-grid)" />
        </svg>
      </div>
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex flex-col items-center gap-3 sm:gap-4 relative">
          <PageHeaderActions rightSlot={<NotificationButton />} />
          <img src={unisynLogo} alt="UniSyn Technology" className="w-32 sm:w-44 h-auto mt-2 sm:mt-0" />
          <PageNavigation items={[{ to: "/incubator", label: "Home" }, { to: "/incubator/applications", label: "Applications", isActive: true }]} />
        </div>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="relative flex flex-col items-center gap-4 mb-6 sm:mb-8">
          <div className="w-full max-w-2xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Your <span className="text-primary">{currentGroup.title}</span> Applications</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{currentGroup.subtitle}</p>
          </div>
          <Button className="xl:absolute xl:right-0 xl:top-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all w-full sm:w-auto touch-manipulation" onClick={() => navigate("/incubator/applications/new")}>
            <Plus className="h-5 w-5 mr-2" /> New Application
          </Button>
        </div>
        <Tabs value={viewMode}>
          <div className="flex justify-center mb-8">
            <StatusTabBar
              label="Application status"
              tabs={GROUPS.map((g) => ({ id: g.id, label: g.label, icon: g.icon, tone: g.tone, count: rows.filter((r) => g.statuses.includes(r.status)).length }))}
              activeId={viewMode}
              onChange={setViewMode}
            />
          </div>
          {GROUPS.map((g) => {
            const list = rows.filter((r) => g.statuses.includes(r.status));
            return (
              <TabsContent key={g.id} value={g.id}>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => <Card key={i} className="backdrop-blur-xl bg-card/60 border-border/50 shadow-lg animate-pulse"><CardHeader className="pb-3"><div className="h-6 bg-muted rounded w-3/4" /></CardHeader><CardContent><div className="space-y-2"><div className="h-4 bg-muted rounded w-1/2" /><div className="h-4 bg-muted rounded w-2/3" /></div></CardContent></Card>)}
                  </div>
                ) : list.length === 0 ? (
                   <div className="py-16 text-center">
                     <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                     <h3 className="text-xl font-semibold mb-2">No {g.label.toLowerCase()} applications</h3>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">{list.map((r) => card(r, g.tone))}</div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationsList;
