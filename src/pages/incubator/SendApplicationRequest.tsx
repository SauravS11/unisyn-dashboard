import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, ShieldCheck, Copy, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";

const SendApplicationRequest = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const link = `${window.location.origin}/apply`;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("applications")
        .select("*, funding_workflows(name)")
        .eq("id", applicationId)
        .maybeSingle();
      if (!data) return toast.error("Application not found");
      setApp(data);
      setEmail(data.contact_email ?? "");
      setDueDate(data.due_date ?? "");
      setMessage(
        data.custom_message ??
          `Dear Applicant,\n\nYou have been invited to complete a funding application for the ${data.funding_workflows?.name} workflow.\n\nPlease complete the guided questions and upload the required supporting documents by the due date.\n\nYou can access the secure application portal using the link and application code below.\n\nNo account or password is required.\n\nKind regards,\nUniSyn Programme Team`,
      );
    })();
  }, [applicationId]);

  const save = async (send: boolean) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({
          applicant_email: email || null,
          due_date: dueDate || null,
          custom_message: message,
          ...(send ? { status: "request_sent", request_sent_at: new Date().toISOString() } : {}),
        })
        .eq("id", applicationId);
      if (error) throw error;
      if (send) {
        await supabase.from("application_activity").insert({
          application_id: applicationId,
          activity_type: "request_sent",
          description: "Application request sent to the applicant",
          actor_type: "manager",
        });
        toast.success("Application request sent — the secure link is now active");
        navigate(`/incubator/applications/${applicationId}/review`);
      } else {
        toast.success("Saved as draft");
        navigate("/incubator/applications");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Could not send the request");
    } finally {
      setSaving(false);
    }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copied");
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <Button
          variant="ghost"
          className="rounded-full gap-2 mb-6"
          onClick={() => navigate(`/incubator/applications/${applicationId}/checklist`)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Checklist
        </Button>

        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Step 4 of 4</p>
        <h1 className="font-display text-4xl tracking-tight mb-2">Send Application Request</h1>
        <p className="text-muted-foreground mb-8">Send the secure application request to your applicant.</p>

        <div className="glass-surface p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Funding Programme</p>
            <p className="font-semibold">{app?.funding_workflows?.name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Applicant</p>
            <p className="font-semibold">{app?.business_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Application Code</p>
            <p className="font-mono">{app?.application_code}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Checklist</p>
            <p className="font-semibold">7 application sections</p>
          </div>
        </div>

        <div className="glass-surface p-6 space-y-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Application Code</Label>
              <div className="flex gap-2">
                <Input readOnly value={app?.application_code ?? ""} className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => copy(app?.application_code ?? "")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Secure Application Link</Label>
              <div className="flex gap-2">
                <Input readOnly value={link} />
                <Button variant="outline" size="icon" onClick={() => copy(link)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Applicant Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="applicant@business.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Due Date for Submission</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Custom Message to Applicant</Label>
            <Textarea rows={10} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>

        <div className="glass-surface p-6 mb-6">
          <h2 className="font-display text-xl mb-4">Application Request Preview</h2>
          <div className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {`Hello,

You have been invited to submit an application for the ${app?.funding_workflows?.name ?? "[Funding Programme]"} workflow.

Please complete the guided questions and upload the requested supporting documents by the due date.

Funding Programme: ${app?.funding_workflows?.name ?? ""}
Applicant: ${app?.business_name ?? ""}
Application Code: ${app?.application_code ?? ""}
Secure Application Link: ${link}
Due Date: ${dueDate || "—"}

No account or password is required.`}
          </div>
        </div>

        <div className="glass-surface p-5 mb-8 flex items-start gap-4">
          <GlassIcon icon={ShieldCheck} size="lg" tone="success" />
          <div>
            <p className="font-semibold">Secure. Private. No sign-up required.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your applicant will access the application using the secure link and application code above.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" className="rounded-full gap-2" disabled={saving} onClick={() => save(false)}>
            <Save className="h-4 w-4" /> Save as Draft
          </Button>
          <Button className="rounded-full gap-2" disabled={saving} onClick={() => save(true)}>
            <Send className="h-4 w-4" /> Send Application Request
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default SendApplicationRequest;
