import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { UserPlus, Briefcase, ArrowUpRight, Inbox, FileCheck2, Activity } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { supabase } from "@/integrations/supabase/customClient";

const Welcome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ pendingIntakes: 0, awaitingReview: 0, activeDeals: 0 });

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const [pending, review, deals] = await Promise.all([
        supabase.from("client_intakes").select("id", { count: "exact", head: true })
          .in("status", ["draft", "request_sent", "awaiting_response", "in_progress"]),
        supabase.from("client_intakes").select("id", { count: "exact", head: true })
          .in("status", ["submitted_for_review", "changes_requested"]),
        supabase.from("deals").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);

      setStats({
        pendingIntakes: pending.count ?? 0,
        awaitingReview: review.count ?? 0,
        activeDeals: deals.count ?? 0,
      });
    })();
  }, []);

  return (
    <PageShell>
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <SignOutButton />
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12 sm:py-16">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <img src={unisynLogo} alt="UniSyn Technology" className="relative w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl" />
        </div>

        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 animate-fade-in px-4 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">M&amp;A Operating System</p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tight mb-4 leading-[1.05]">
            Welcome to <span className="text-gradient-brand">UniSyn</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground/90 max-w-xl mx-auto leading-relaxed">
            Centralise every signal, document, and decision across your transaction lifecycle.
          </p>
        </div>

        {/* Two primary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-5xl px-4">
          <Card
            onClick={() => navigate("/onboarding/new")}
            className="group cursor-pointer relative overflow-hidden glass-surface-strong lift-hover border-primary/20"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
            <CardHeader className="space-y-5 relative">
              <div className="flex items-start justify-between">
                <GlassIcon icon={UserPlus} size="xl" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                  Primary
                </span>
              </div>
              <div>
                <CardTitle className="font-display text-3xl tracking-tight">Onboard a Client</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-2">
                  Create a seller or buyer intake, configure Pre-Due-Diligence categories, send a secure request, and review before deal creation.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <Button className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-glow-primary">
                Start Client Onboarding
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/deals")}
            className="group cursor-pointer relative overflow-hidden glass-surface lift-hover"
          >
            <CardHeader className="space-y-5">
              <div className="flex items-start justify-between">
                <GlassIcon icon={Briefcase} size="xl" tone="neutral" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-medium px-3 py-1 rounded-full bg-muted/60 border border-border/60">
                  {stats.activeDeals} active
                </span>
              </div>
              <div>
                <CardTitle className="font-display text-3xl tracking-tight">View Deals</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-2">
                  Access active deals, monitor progress, review risks, and continue due diligence workflows.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full h-12 text-base font-semibold gap-2 rounded-xl backdrop-glass bg-card/40">
                View Deals
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lower widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-5xl px-4 mt-6">
          <WidgetCard icon={Inbox} label="Pending Client Intakes" value={stats.pendingIntakes} onClick={() => navigate("/deals")} />
          <WidgetCard icon={FileCheck2} label="Awaiting Review" value={stats.awaitingReview} onClick={() => navigate("/deals")} />
          <WidgetCard icon={Activity} label="Active Deals" value={stats.activeDeals} onClick={() => navigate("/deals")} />
        </div>

        <p className="mt-16 text-xs text-muted-foreground/80 text-center px-4 tracking-wide">
          © 2026 UniSyn Technology · Crafted for precision deal operations
        </p>
      </div>
    </PageShell>
  );
};

const WidgetCard = ({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: number;
  onClick?: () => void;
}) => {
  const Icon = icon as any;
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer glass-surface lift-hover border-border/40"
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          <GlassIcon icon={Icon} size="sm" />
          <span className="text-sm font-medium text-muted-foreground truncate">{label}</span>
        </div>
        <span className="font-display text-3xl tracking-tight tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
};

export default Welcome;
