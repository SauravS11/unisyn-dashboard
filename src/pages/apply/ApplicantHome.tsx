import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  Radio,
  ShieldCheck,
  X,
} from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.svg";
import {
  clearApplicationSession,
  getApplicationOverview,
  getApplicationSession,
  sectionCompletion,
} from "@/lib/incubatorClient";
import { SECTION_STATUS_LABELS } from "@/lib/fundingWorkflows";
import { getProgressColors } from "@/lib/progressColors";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";

const ApplicantHome = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setData(await getApplicationOverview());
    } catch (e: any) {
      toast.error(e.message ?? "Session expired");
      navigate("/apply");
    }
  }, [navigate]);

  useEffect(() => {
    const { applicationId } = getApplicationSession();
    if (!applicationId) {
      navigate("/apply");
      return;
    }
    load();
    const channel = supabase
      .channel(`applicant-${applicationId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_clarifications" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "application_documents" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, navigate]);

  const sections: any[] = data?.sections ?? [];
  const totals = sections.reduce(
    (acc, s) => {
      acc.total += (s.response_total ?? 0) + (s.document_total ?? 0);
      acc.done += (s.responses_done ?? 0) + (s.documents_done ?? 0);
      return acc;
    },
    { total: 0, done: 0 },
  );
  const overall = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
  const started = totals.done > 0;
  const clarifications: any[] = data?.clarifications ?? [];

  const exit = () => {
    clearApplicationSession();
    navigate("/apply");
  };

  const firstIncomplete = sections.find((s) => sectionCompletion(s) < 100) ?? sections[0];

  return (
    <PageShell>
      <header className="sticky top-0 z-30 backdrop-glass bg-background/70 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={unisynLogo} alt="UniSyn" className="w-28 h-auto" />
            <div className="hidden sm:block min-w-0 pl-3 border-l border-border/50">
              <p className="text-sm font-semibold truncate">{data?.application?.business_name ?? "Your application"}</p>
              <p className="text-[11px] font-mono text-muted-foreground">{data?.application?.application_code ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-green-600">
              <Radio className="h-3.5 w-3.5" /> Live sync active
            </span>
            <div className="hidden md:flex items-center gap-2 w-40">
              <Progress value={overall} className="h-1.5" />
              <span className="text-xs font-semibold tabular-nums">{overall}%</span>
            </div>
            <Button variant="ghost" size="sm" className="rounded-full gap-1.5">
              <CircleHelp className="h-4 w-4" /> Help
            </Button>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={exit}>
              <X className="h-4 w-4" /> Exit
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Requirements Completed", value: `${totals.done} of ${totals.total}` },
            { label: "Sections", value: sections.length },
            { label: "Funding Programme", value: data?.workflow?.name ?? "—" },
            {
              label: "Due Date",
              value: data?.application?.due_date ? new Date(data.application.due_date).toLocaleDateString() : "—",
            },
          ].map((m) => (
            <div key={m.label} className="glass-surface p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="font-semibold mt-1 text-sm sm:text-base">{m.value}</p>
            </div>
          ))}
        </div>

        {clarifications.length > 0 && (
          <div className="glass-surface p-5 mb-8 border-amber-500/40">
            <Badge variant="outline" className="rounded-full text-amber-600 border-amber-500/40 mb-3">
              Needs Attention
            </Badge>
            <p className="font-semibold">Your programme manager has requested an update.</p>
            <ul className="mt-3 space-y-3">
              {clarifications.map((c) => (
                <li key={c.id} className="text-sm">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-muted-foreground">{c.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Action needed: {c.requested_action} · Priority {c.priority}
                    {c.due_date ? ` · Due ${new Date(c.due_date).toLocaleDateString()}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-10 max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Welcome to your application</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">
            Let’s complete your <span className="text-gradient-brand">{data?.workflow?.name ?? "funding"}</span>{" "}
            application.
          </h1>
          <p className="text-muted-foreground mt-4">
            A simple, guided process to help you provide the information needed to assess your funding request.
          </p>
          <div className="glass-surface p-5 mt-6 flex items-start gap-4">
            <GlassIcon icon={ShieldCheck} size="lg" tone="success" />
            <div>
              <p className="font-semibold">Secure. Private. No sign-up required.</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can save your progress and return anytime using your application code and secure link.
              </p>
            </div>
          </div>
          <Button
            className="rounded-full mt-6 gap-2"
            size="lg"
            onClick={() => firstIncomplete && navigate(`/apply/${data.application.id}/section/${firstIncomplete.section_code}`)}
          >
            {started ? "Continue with application" : "Start application"} <ChevronRight className="h-4 w-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Part 1 — Guided Questions · Part 2 — Upload Supporting Documents
          </p>
        </div>

        <h2 className="font-display text-2xl mb-4">Application Sections</h2>
        <div className="space-y-3">
          {sections.map((s) => {
            const pct = sectionCompletion(s);
            const colors = getProgressColors(pct);
            return (
              <button
                key={s.section_id}
                onClick={() => navigate(`/apply/${data.application.id}/section/${s.section_code}`)}
                className="w-full glass-surface lift-hover p-5 flex items-center gap-4 text-left"
              >
                <GlassIcon icon={s.section_code === "G" ? FileText : ClipboardList} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-display text-lg leading-tight">
                    {s.section_code} — {s.section_name}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <Progress value={pct} className="h-1.5 max-w-xs" />
                    <span className={`text-xs font-semibold tabular-nums ${colors.text}`}>{pct}%</span>
                  </div>
                </div>
                <Badge variant="outline" className="rounded-full shrink-0">
                  {SECTION_STATUS_LABELS[s.status] ?? s.status}
                </Badge>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>

        <div className="glass-surface p-4 mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>You can save your progress at any time. Your responses are securely saved as you go.</span>
          <span>Need help? Contact your programme manager.</span>
        </div>
      </div>
    </PageShell>
  );
};

export default ApplicantHome;
