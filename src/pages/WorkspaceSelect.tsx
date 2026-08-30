import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Briefcase, Rocket, ArrowUpRight } from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";

const WorkspaceSelect = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) navigate("/auth");
    })();
  }, [navigate]);

  const choose = async (type: "mna_deals" | "incubators_accelerators") => {
    setSaving(type);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        navigate("/auth");
        return;
      }
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata as any)?.full_name ?? null,
        workflow_type: type,
      });
      if (error) throw error;
      navigate(type === "mna_deals" ? "/welcome" : "/incubator");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save your workspace selection");
    } finally {
      setSaving(null);
    }
  };

  const options = [
    {
      id: "mna_deals" as const,
      icon: Briefcase,
      eyebrow: "Transactions",
      title: "M&A / Deals",
      description: "Run pre-due diligence, deal workspaces, and transaction checklists.",
    },
    {
      id: "incubators_accelerators" as const,
      icon: Rocket,
      eyebrow: "Funding Programmes",
      title: "Incubators & Accelerators",
      description: "Run funding applications across seven programme workflows.",
    },
  ];

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-14">
        <img src={unisynLogo} alt="UniSyn" className="w-44 sm:w-52 h-auto mb-8 drop-shadow-2xl" />
        <div className="text-center mb-10 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Choose your workspace</p>
          <h1 className="font-display text-4xl sm:text-5xl tracking-tight leading-tight">
            Where are you working <span className="text-gradient-brand">today</span>?
          </h1>
          <p className="text-muted-foreground mt-4">You can switch workspaces at any time.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-4xl">
          {options.map((o) => (
            <Card
              key={o.id}
              onClick={() => !saving && choose(o.id)}
              className="group cursor-pointer glass-surface-strong lift-hover border-primary/20"
            >
              <CardHeader className="space-y-5">
                <div className="flex items-start justify-between">
                  <GlassIcon icon={o.icon} size="xl" />
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{o.eyebrow}</p>
                  <CardTitle className="font-display text-2xl">{o.title}</CardTitle>
                  <CardDescription className="mt-2">{o.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {saving === o.id ? "Opening workspace…" : "Continue"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </PageShell>
  );
};

export default WorkspaceSelect;
