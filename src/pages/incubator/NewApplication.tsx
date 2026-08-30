import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Rocket, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { fetchWorkflows, type FundingWorkflow } from "@/lib/incubatorClient";
import { COMMON_FIELDS, WORKFLOW_FIELDS, type FieldConfig } from "@/lib/fundingWorkflows";
import { toast } from "sonner";

const COMMON_KEYS = COMMON_FIELDS.map((f) => f.key);

const NewApplication = () => {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const [workflows, setWorkflows] = useState<FundingWorkflow[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({ country: "South Africa" });
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWorkflows().then(setWorkflows).catch((e) => toast.error(e.message));
  }, []);

  useEffect(() => {
    if (!applicationId) return;
    (async () => {
      const { data } = await supabase.from("applications").select("*").eq("id", applicationId).maybeSingle();
      if (!data) return;
      setWorkflowId(data.funding_workflow_id);
      const specific = (data.specific_fields ?? {}) as Record<string, string>;
      const common: Record<string, string> = {};
      COMMON_KEYS.forEach((k) => ((common as any)[k] = (data as any)[k] ?? ""));
      setValues({ ...common, ...specific });
      setStep(2);
    })();
  }, [applicationId]);

  const workflow = workflows.find((w) => w.id === workflowId) ?? null;
  const specificFields: FieldConfig[] = useMemo(
    () => (workflow ? WORKFLOW_FIELDS[workflow.slug] ?? [] : []),
    [workflow],
  );

  const set = (k: string, v: string) => setValues((p) => ({ ...p, [k]: v }));

  const renderField = (f: FieldConfig) => (
    <div key={f.key} className="space-y-2">
      <Label htmlFor={f.key} className="text-xs uppercase tracking-wider text-muted-foreground">
        {f.label}
      </Label>
      {f.type === "textarea" ? (
        <Textarea id={f.key} value={values[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} rows={3} />
      ) : f.type === "select" ? (
        <Select value={values[f.key] ?? ""} onValueChange={(v) => set(f.key, v)}>
          <SelectTrigger id={f.key}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={f.key}
          type={f.type === "number" || f.type === "currency" ? "number" : f.type === "date" ? "date" : "text"}
          value={values[f.key] ?? ""}
          onChange={(e) => set(f.key, e.target.value)}
        />
      )}
    </div>
  );

  const save = async (goNext: boolean) => {
    if (!workflowId) return toast.error("Select a funding programme first");
    if (!values.business_name?.trim()) return toast.error("Business / Startup Name is required");
    setSaving(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Please sign in again");
      const specific: Record<string, string> = {};
      specificFields.forEach((f) => {
        if (values[f.key]) specific[f.key] = values[f.key];
      });
      const payload: any = {
        funding_workflow_id: workflowId,
        created_by: u.user.id,
        specific_fields: specific,
      };
      COMMON_KEYS.forEach((k) => (payload[k] = values[k] || null));
      payload.business_name = values.business_name;

      let id = applicationId;
      if (id) {
        const { error } = await supabase.from("applications").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("applications").insert(payload).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      await supabase.rpc("seed_application_sections", { p_application_id: id });
      toast.success(goNext ? "Applicant profile saved" : "Saved as draft");
      navigate(goNext ? `/incubator/applications/${id}/checklist` : "/incubator/applications");
    } catch (e: any) {
      toast.error(e.message ?? "Could not save the application");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Button variant="ghost" className="rounded-full gap-2 mb-6" onClick={() => navigate("/incubator")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {step === 1 ? (
          <>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Step 1 of 4</p>
            <h1 className="font-display text-4xl tracking-tight mb-2">Select Funding Programme</h1>
            <p className="text-muted-foreground mb-8">
              Choose the funding workflow this applicant is applying for. The checklist is generated automatically.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {workflows.map((w) => (
                <Card
                  key={w.id}
                  onClick={() => {
                    setWorkflowId(w.id);
                    setStep(2);
                  }}
                  className={`cursor-pointer glass-surface lift-hover ${workflowId === w.id ? "border-primary/50" : ""}`}
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <GlassIcon icon={Rocket} size="lg" />
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary">
                        {w.code_prefix}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="font-display text-xl">{w.name}</CardTitle>
                      <CardDescription className="mt-2">{w.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">7 application sections</CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Step 2 of 4</p>
            <h1 className="font-display text-4xl tracking-tight mb-2">Applicant Profile</h1>
            <p className="text-muted-foreground mb-8">
              {workflow?.name} — capture who is applying and the key funding details.
            </p>

            <div className="glass-surface p-6 mb-6">
              <h2 className="font-display text-xl mb-5">Applicant Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{COMMON_FIELDS.map(renderField)}</div>
            </div>

            {specificFields.length > 0 && (
              <div className="glass-surface p-6 mb-6">
                <h2 className="font-display text-xl mb-5">{workflow?.name} Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{specificFields.map(renderField)}</div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 justify-between">
              <Button variant="outline" className="rounded-full" onClick={() => setStep(1)}>
                Change funding programme
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-full gap-2" disabled={saving} onClick={() => save(false)}>
                  <Save className="h-4 w-4" /> Save Draft
                </Button>
                <Button className="rounded-full gap-2" disabled={saving} onClick={() => save(true)}>
                  Continue to Checklist <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
};

export default NewApplication;
