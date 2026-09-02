import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/customClient";
import { setIntakeSession } from "@/lib/intakeClient";
import { setApplicationSession, verifyApplicationCode } from "@/lib/incubatorClient";

const INCUBATOR_PREFIXES = ["BUSFIN", "PROPFIN", "PROPJV", "ASSET", "SHORT", "BASADI", "YOUTH"];

import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { toast } from "sonner";
import { KeyRound, ArrowRight } from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.svg";

export default function AccessRequest() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) { toast.error("Enter your access code"); return; }
    const value = code.trim().toUpperCase();
    setBusy(true);
    try {
      // Funding programme (Incubators & Accelerators) application codes
      const prefix = value.split("-")[0];
      if (INCUBATOR_PREFIXES.includes(prefix)) {
        const res = await verifyApplicationCode(value);
        if (!res?.success || !res.access_token || !res.application_id) {
          toast.error(res?.message ?? "Invalid application code");
          return;
        }
        setApplicationSession({
          accessToken: res.access_token,
          applicationId: res.application_id,
          applicationCode: res.application_code ?? value,
        });
        navigate(`/apply/${res.application_id}`);
        return;
      }

      const { data, error } = await supabase.rpc("verify_intake_code", { p_code: value });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row?.success) {
        toast.error(row?.message ?? error?.message ?? "Invalid code");
        return;
      }
      setIntakeSession({
        accessToken: row.access_token,
        intakeId: row.intake_id,
        intakeCode: row.intake_code,
      });
      navigate(`/respond/${row.intake_id}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };


  return (
    <PageShell>
      <div className="flex items-center justify-center min-h-screen px-4 py-10">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <img src={unisynLogo} alt="UniSyn" className="w-48" />
          </div>
          <Card className="glass-surface-strong">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3">
                <GlassIcon icon={KeyRound} size="xl" />
              </div>
              <CardTitle className="font-display text-3xl tracking-tight">Access Your Request</CardTitle>
              <CardDescription className="text-sm">
                Enter the secure code provided by your advisor. No sign up needed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Deal Code</Label>
                <Input
                  placeholder="USYN-2026-0001"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono tracking-wider h-12 text-base backdrop-glass bg-card/60"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              <Button className="w-full h-12 gap-2 rounded-xl shadow-glow-primary text-base font-semibold" onClick={submit} disabled={busy}>
                {busy ? "Verifying…" : "Access Request"} <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground/80 pt-1">
                Your session is secure and time-limited.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
