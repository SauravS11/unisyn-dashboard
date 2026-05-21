import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { ArrowLeft, Send, Copy, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SendRequest() {
  const { intakeId } = useParams();
  const navigate = useNavigate();
  const [intake, setIntake] = useState<any>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [customMessage, setCustomMessage] = useState(
    "We are conducting a Pre-Due-Diligence review and request your secure submission of responses and supporting documents."
  );
  const [sending, setSending] = useState(false);

  const portalUrl = `${window.location.origin}/respond`;

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("client_intakes")
        .select("*")
        .eq("id", intakeId)
        .single();
      setIntake(data);
      setRecipientEmail(data?.primary_contact_email ?? "");
      if (data?.due_date) setDueDate(data.due_date);
    })();
  }, [intakeId]);

  const send = async () => {
    if (!recipientEmail) { toast.error("Recipient email required"); return; }
    if (!dueDate) { toast.error("Due date required"); return; }
    setSending(true);
    try {
      const { error } = await (supabase as any)
        .from("client_intakes")
        .update({
          status: "request_sent",
          due_date: dueDate,
          primary_contact_email: recipientEmail,
        })
        .eq("id", intakeId);
      if (error) throw error;
      await (supabase as any).from("intake_activity_log").insert({
        client_intake_id: intakeId,
        activity_type: "request_sent",
        description: `Secure request sent to ${recipientEmail}`,
        actor_type: "advisor",
        actor_email: recipientEmail,
      });
      toast.success("Request sent!");
      navigate(`/onboarding/${intakeId}/review`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSending(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  if (!intake) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-10 px-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/onboarding/${intakeId}/categories`)} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Send Client Request</CardTitle>
            <CardDescription>Step 3 of 3 — Issue the secure request to your respondent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border/50 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Intake Code</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-mono font-bold text-primary">{intake.intake_code}</p>
                  <Button variant="ghost" size="icon" onClick={() => copy(intake.intake_code)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-card/40 p-3">
                <p className="text-xs text-muted-foreground">Secure Portal Link</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono truncate">{portalUrl}</p>
                  <Button variant="ghost" size="icon" onClick={() => copy(portalUrl)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Recipient email</Label>
                <Input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Custom message</Label>
              <Textarea rows={4} value={customMessage} onChange={(e) => setCustomMessage(e.target.value)} />
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm">
              <p className="font-semibold mb-2">Email preview</p>
              <p>Hello,</p>
              <p className="mt-2">
                {customMessage}
              </p>
              <p className="mt-2">
                <strong>Company:</strong> {intake.company_name}<br />
                <strong>Intake code:</strong> <span className="font-mono">{intake.intake_code}</span><br />
                <strong>Secure link:</strong> {portalUrl}<br />
                <strong>Due:</strong> {dueDate || "—"}
              </p>
              <p className="mt-2 text-muted-foreground text-xs">No account or password is required to respond.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/welcome")} disabled={sending} className="gap-2">
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button onClick={send} disabled={sending} className="gap-2 sm:ml-auto">
                <Send className="h-4 w-4" /> Send Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
