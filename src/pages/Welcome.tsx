import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { UserPlus, Briefcase, ArrowRight, Inbox, FileCheck2, Activity } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
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
        supabase
          .from("client_intakes")
          .select("id", { count: "exact", head: true })
          .in("status", ["draft", "request_sent", "awaiting_response", "in_progress"]),
        supabase
          .from("client_intakes")
          .select("id", { count: "exact", head: true })
          .in("status", ["submitted_for_review", "changes_requested"]),
        supabase
          .from("deals")
          .select("id", { count: "exact", head: true })
          .eq("user_id", uid),
      ]);

      setStats({
        pendingIntakes: pending.count ?? 0,
        awaitingReview: review.count ?? 0,
        activeDeals: deals.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-background via-background to-muted">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-primary/10 blur-[140px] rounded-full" />
      </div>

      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <SignOutButton />
      </div>
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12 sm:py-16">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 relative">
          <div className="absolute inset-0 bg-primary/15 blur-3xl rounded-full scale-150" />
          <img src={unisynLogo} alt="UniSyn Technology" className="relative w-52 sm:w-64 md:w-72 h-auto drop-shadow-2xl" />
        </div>

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in px-4 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3 sm:mb-4">
            <span className="text-foreground">Welcome to Uni</span>
            <span className="text-primary">Syn</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-light">
            Centralise your M&amp;A workflow.
          </p>
        </div>

        {/* Two primary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full max-w-5xl px-4">
          {/* Onboard a Client (primary) */}
          <Card
            onClick={() => navigate("/onboarding/new")}
            className="group cursor-pointer relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-primary/10 via-card/70 to-card/60 border-primary/30 shadow-2xl hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserPlus className="w-7 h-7 text-primary" strokeWidth={1.75} />
                </div>
                <span className="text-xs uppercase tracking-wider text-primary font-semibold px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
                  Primary
                </span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Onboard a Client</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Create a seller or buyer intake, select Pre-Due-Diligence categories, send a secure request, and review submitted information before creating a deal.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <Button className="w-full h-12 text-base font-semibold gap-2">
                Start Client Onboarding
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* View Deals */}
          <Card
            onClick={() => navigate("/deals")}
            className="group cursor-pointer relative overflow-hidden backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300"
          >
            <CardHeader className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="w-7 h-7 text-primary" strokeWidth={1.75} />
                </div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {stats.activeDeals} active
                </span>
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">View Deals</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                Access active deals, monitor progress, review risks, and continue due diligence workflows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full h-12 text-base font-semibold gap-2">
                View Deals
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Lower widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-5xl px-4 mt-6">
          <WidgetCard
            icon={<Inbox className="w-5 h-5 text-primary" />}
            label="Pending Client Intakes"
            value={stats.pendingIntakes}
            onClick={() => navigate("/deals")}
          />
          <WidgetCard
            icon={<FileCheck2 className="w-5 h-5 text-primary" />}
            label="Awaiting Review"
            value={stats.awaitingReview}
            onClick={() => navigate("/deals")}
          />
          <WidgetCard
            icon={<Activity className="w-5 h-5 text-primary" />}
            label="Active Deals"
            value={stats.activeDeals}
            onClick={() => navigate("/deals")}
          />
        </div>

        <p className="mt-12 sm:mt-16 text-xs sm:text-sm text-muted-foreground text-center px-4">
          © 2026 UniSyn Technology. All rights reserved.
        </p>
      </div>
    </div>
  );
};

const WidgetCard = ({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onClick?: () => void;
}) => (
  <Card
    onClick={onClick}
    className="cursor-pointer backdrop-blur-xl bg-card/40 border-border/40 hover:bg-card/60 hover:border-primary/30 transition-all"
  >
    <CardContent className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">{icon}</div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
    </CardContent>
  </Card>
);

export default Welcome;
