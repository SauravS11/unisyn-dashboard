import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { FilePlus2, FolderOpen, Inbox, CheckCircle2, ArrowUpRight, Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";

const IncubatorWelcome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ drafts: 0, active: 0, review: 0, approved: 0 });

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) {
        navigate("/auth");
        return;
      }
      const { data } = await supabase.from("applications").select("status");
      const rows = data ?? [];
      setStats({
        drafts: rows.filter((r: any) => r.status === "draft").length,
        active: rows.filter((r: any) => ["request_sent", "in_progress"].includes(r.status)).length,
        review: rows.filter((r: any) =>
          ["submitted_for_review", "in_review", "clarification_requested"].includes(r.status),
        ).length,
        approved: rows.filter((r: any) => r.status === "approved").length,
      });
    })();
  }, [navigate]);

  const metrics = [
    { icon: Inbox, label: "Draft Applications", value: stats.drafts },
    { icon: FolderOpen, label: "Applications In Progress", value: stats.active },
    { icon: Repeat, label: "Awaiting Review", value: stats.review },
    { icon: CheckCircle2, label: "Approved", value: stats.approved },
  ];

  return (
    <PageShell>
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20 flex items-center gap-2">
        <SignOutButton />
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate("/workspace")}>
          Switch workspace
        </Button>
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center min-h-screen px-4 sm:px-6 py-16">
        <img src={unisynLogo} alt="UniSyn" className="w-48 sm:w-60 h-auto mb-8 drop-shadow-2xl" />
        <div className="text-center mb-12 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
            Incubators &amp; Accelerators
          </p>
          <h1 className="font-display text-4xl sm:text-6xl tracking-tight mb-4 leading-[1.05]">
            Funding applications, <span className="text-gradient-brand">structured</span>.
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Create a funding application, send a secure request, and track every applicant response in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-5xl mb-10">
          <Card
            onClick={() => navigate("/incubator/applications/new")}
            className="group cursor-pointer glass-surface-strong lift-hover border-primary/20"
          >
            <CardHeader className="space-y-5">
              <div className="flex items-start justify-between">
                <GlassIcon icon={FilePlus2} size="xl" />
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl">New Funding Application</CardTitle>
                <CardDescription className="mt-2">
                  Pick a funding programme, capture the applicant profile, and send the secure request.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>

          <Card
            onClick={() => navigate("/incubator/applications")}
            className="group cursor-pointer glass-surface-strong lift-hover"
          >
            <CardHeader className="space-y-5">
              <div className="flex items-start justify-between">
                <GlassIcon icon={FolderOpen} size="xl" tone="neutral" />
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div>
                <CardTitle className="font-display text-2xl">Your Applications</CardTitle>
                <CardDescription className="mt-2">
                  Track drafts, live applications, reviews, and approvals across every programme.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-5xl">
          {metrics.map((m) => (
            <div key={m.label} className="glass-surface p-5 flex items-center gap-4">
              <GlassIcon icon={m.icon} tone="neutral" />
              <div>
                <p className="text-2xl font-semibold tabular-nums leading-none">{m.value}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default IncubatorWelcome;
