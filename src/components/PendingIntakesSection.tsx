import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/customClient";
import { Inbox, ChevronRight } from "lucide-react";

interface Intake {
  id: string;
  intake_code: string;
  company_name: string;
  client_type: string;
  status: string;
  due_date: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  request_sent: "Request Sent",
  awaiting_response: "Awaiting Response",
  in_progress: "In Progress",
  submitted_for_review: "Submitted for Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
};

export const PendingIntakesSection = () => {
  const navigate = useNavigate();
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) { setLoading(false); return; }
      const { data } = await (supabase as any)
        .from("client_intakes")
        .select("id, intake_code, company_name, client_type, status, due_date")
        .eq("created_by", userData.user.id)
        .neq("status", "converted_to_deal")
        .order("created_at", { ascending: false });
      setIntakes(data ?? []);
      setLoading(false);
    })();
  }, []);

  const resumeIntake = async (intake: Intake) => {
    // Route by status / progress so user lands where they left off
    if (intake.status === "draft") {
      const { count } = await (supabase as any)
        .from("client_intake_categories")
        .select("id", { count: "exact", head: true })
        .eq("client_intake_id", intake.id);
      if ((count ?? 0) === 0) {
        navigate(`/onboarding/${intake.id}/profile`);
      } else {
        navigate(`/onboarding/${intake.id}/send`);
      }
      return;
    }
    navigate(`/onboarding/${intake.id}/review`);
  };

  if (loading || intakes.length === 0) return null;

  return (
    <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" /> Pending Client Intakes
        </CardTitle>
        <Badge variant="secondary">{intakes.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {intakes.map((i) => (
          <button
            key={i.id}
            onClick={() => navigate(`/onboarding/${i.id}/review`)}
            className="w-full flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-card/40 hover:bg-card/70 hover:border-primary/30 transition-all p-3 text-left"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{i.company_name}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono text-primary">{i.intake_code}</span> · {i.client_type}
                {i.due_date && <> · due {new Date(i.due_date).toLocaleDateString()}</>}
              </p>
            </div>
            <Badge variant="outline" className="text-xs whitespace-nowrap">
              {STATUS_LABEL[i.status] ?? i.status}
            </Badge>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/onboarding/new")}>
          + Start a new client onboarding
        </Button>
      </CardContent>
    </Card>
  );
};
