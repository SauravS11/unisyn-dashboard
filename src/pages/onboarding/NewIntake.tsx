import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const schema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  primary_contact_email: z.string().trim().email("Valid email required").max(255),
  client_type: z.enum(["seller", "buyer", "target"]),
  entity_type: z.string().trim().min(1, "Entity type is required").max(100),
});

const EMPTY = {
  client_type: "seller" as "seller" | "buyer" | "target",
  company_name: "",
  registration_number: "",
  entity_type: "",
  industry: "",
  sector: "",
  country: "",
  primary_contact_name: "",
  primary_contact_role: "",
  primary_contact_email: "",
  primary_contact_phone: "",
  advisor_notes: "",
};

type SaveState = "idle" | "saving" | "saved" | "error";

export default function NewIntake() {
  const navigate = useNavigate();
  const { intakeId: routeIntakeId } = useParams();
  const [intakeId, setIntakeId] = useState<string | null>(routeIntakeId ?? null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(!!routeIntakeId);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [continuing, setContinuing] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const creatingRef = useRef(false);

  // Load existing intake if editing
  useEffect(() => {
    (async () => {
      if (!routeIntakeId) return;
      const { data, error } = await (supabase as any)
        .from("client_intakes")
        .select("*")
        .eq("id", routeIntakeId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load intake");
        navigate("/welcome");
        return;
      }
      setForm({
        client_type: data.client_type ?? "seller",
        company_name: data.company_name ?? "",
        registration_number: data.registration_number ?? "",
        entity_type: data.entity_type ?? "",
        industry: data.industry ?? "",
        sector: data.sector ?? "",
        country: data.country ?? "",
        primary_contact_name: data.primary_contact_name ?? "",
        primary_contact_role: data.primary_contact_role ?? "",
        primary_contact_email: data.primary_contact_email ?? "",
        primary_contact_phone: data.primary_contact_phone ?? "",
        advisor_notes: data.advisor_notes ?? "",
      });
      setLoading(false);
    })();
  }, [routeIntakeId, navigate]);

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    scheduleAutoSave({ ...form, [k]: v });
  };

  const scheduleAutoSave = (next: typeof form) => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => autoSave(next), 800);
  };

  const autoSave = async (snapshot: typeof form) => {
    // Need minimum fields before first persist
    if (!snapshot.company_name.trim() || !snapshot.entity_type.trim() || !snapshot.primary_contact_email.trim()) {
      return;
    }
    const parsed = schema.safeParse(snapshot);
    if (!parsed.success) return;

    try {
      setSaveState("saving");
      if (!intakeId) {
        if (creatingRef.current) return;
        creatingRef.current = true;
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) { creatingRef.current = false; setSaveState("error"); return; }
        const { data, error } = await (supabase as any)
          .from("client_intakes")
          .insert({ ...snapshot, created_by: uid })
          .select("id")
          .single();
        creatingRef.current = false;
        if (error) throw error;
        setIntakeId(data.id);
        // Replace URL so refresh resumes here
        window.history.replaceState(null, "", `/onboarding/${data.id}/profile`);
      } else {
        const { error } = await (supabase as any)
          .from("client_intakes")
          .update(snapshot)
          .eq("id", intakeId);
        if (error) throw error;
      }
      setSaveState("saved");
    } catch (e: any) {
      console.error(e);
      setSaveState("error");
    }
  };

  const handleContinue = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setContinuing(true);
    // Flush any pending autosave
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    await autoSave(form);
    setContinuing(false);
    const id = intakeId ?? (await getJustCreatedId());
    if (id) navigate(`/onboarding/${id}/categories`);
  };

  const getJustCreatedId = async () => {
    // Safety fallback if autoSave hasn't set state yet
    await new Promise((r) => setTimeout(r, 300));
    return intakeId;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-10 px-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/welcome")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl font-bold">Client Intake Profile</CardTitle>
                <CardDescription>
                  Step 1 of 3 — Create the seller, buyer, or target company profile.
                </CardDescription>
              </div>
              <SaveIndicator state={saveState} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Client type *">
                <Select value={form.client_type} onValueChange={(v) => update("client_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seller">Seller</SelectItem>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="target">Target Company</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Entity type *">
                <Input value={form.entity_type} onChange={(e) => update("entity_type", e.target.value)} placeholder="e.g. (Pty) Ltd" />
              </Field>
              <Field label="Company name *">
                <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
              </Field>
              <Field label="Registration number">
                <Input value={form.registration_number} onChange={(e) => update("registration_number", e.target.value)} />
              </Field>
              <Field label="Industry"><Input value={form.industry} onChange={(e) => update("industry", e.target.value)} /></Field>
              <Field label="Sector"><Input value={form.sector} onChange={(e) => update("sector", e.target.value)} /></Field>
              <Field label="Country"><Input value={form.country} onChange={(e) => update("country", e.target.value)} /></Field>
              <Field label="Primary contact name"><Input value={form.primary_contact_name} onChange={(e) => update("primary_contact_name", e.target.value)} /></Field>
              <Field label="Primary contact role"><Input value={form.primary_contact_role} onChange={(e) => update("primary_contact_role", e.target.value)} /></Field>
              <Field label="Primary contact email *"><Input type="email" value={form.primary_contact_email} onChange={(e) => update("primary_contact_email", e.target.value)} /></Field>
              <Field label="Primary contact phone"><Input value={form.primary_contact_phone} onChange={(e) => update("primary_contact_phone", e.target.value)} /></Field>
            </div>
            <Field label="Advisor notes">
              <Textarea rows={3} value={form.advisor_notes} onChange={(e) => update("advisor_notes", e.target.value)} />
            </Field>

            <div className="flex justify-end pt-2">
              <Button className="gap-2" onClick={handleContinue} disabled={continuing}>
                Continue to Categories <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
  </div>
);

const SaveIndicator = ({ state }: { state: SaveState }) => {
  if (state === "idle") return null;
  if (state === "saving") return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
  );
  if (state === "saved") return (
    <span className="flex items-center gap-1.5 text-xs text-emerald-500"><Check className="h-3.5 w-3.5" /> Saved</span>
  );
  return <span className="text-xs text-destructive">Save failed</span>;
};
