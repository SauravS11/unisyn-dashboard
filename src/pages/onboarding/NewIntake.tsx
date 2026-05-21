import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const schema = z.object({
  company_name: z.string().trim().min(1, "Company name is required").max(200),
  primary_contact_email: z.string().trim().email("Valid email required").max(255),
  client_type: z.enum(["seller", "buyer", "target"]),
  entity_type: z.string().trim().min(1, "Entity type is required").max(100),
});

export default function NewIntake() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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
  });

  const update = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (continueNext: boolean) => {
    setSaving(true);
    try {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        toast.error(parsed.error.errors[0].message);
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) {
        toast.error("Please sign in again.");
        return;
      }
      const { data, error } = await (supabase as any)
        .from("client_intakes")
        .insert({ ...form, created_by: uid })
        .select("id, intake_code")
        .single();
      if (error) throw error;
      toast.success(`Intake ${data.intake_code} saved`);
      if (continueNext) navigate(`/onboarding/${data.id}/categories`);
      else navigate("/welcome");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-10 px-4">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate("/welcome")} className="mb-4 gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Client Intake Profile</CardTitle>
            <CardDescription>
              Step 1 of 3 — Create the seller, buyer, or target company profile.
            </CardDescription>
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

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="gap-2" onClick={() => save(false)} disabled={saving}>
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button className="gap-2 sm:ml-auto" onClick={() => save(true)} disabled={saving}>
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
