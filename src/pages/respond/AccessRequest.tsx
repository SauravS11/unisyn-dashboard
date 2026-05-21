import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/customClient";
import { setIntakeSession } from "@/lib/intakeClient";
import { toast } from "sonner";
import { Lock, ArrowRight } from "lucide-react";
import unisynLogo from "@/assets/unisyn-logo.svg";

export default function AccessRequest() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!code.trim()) { toast.error("Enter the deal/intake code"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-intake-code", {
        body: { code: code.trim() },
      });
      if (error || !data?.success) {
        toast.error(data?.message ?? "Invalid code");
        return;
      }
      setIntakeSession({
        accessToken: data.accessToken,
        intakeId: data.intakeId,
        intakeCode: data.intakeCode,
      });
      navigate(`/respond/${data.intakeId}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted px-4">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-primary/15 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] bg-primary/10 blur-[140px] rounded-full" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src={unisynLogo} alt="UniSyn" className="w-48" />
        </div>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Access Your Request</CardTitle>
            <CardDescription>
              Enter the secure code provided by your advisor. No sign up or password needed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Deal Code</Label>
              <Input
                placeholder="USYN-2026-0001"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="font-mono tracking-wider"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            <Button className="w-full h-11 gap-2" onClick={submit} disabled={busy}>
              {busy ? "Verifying…" : "Access Request"} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Your session is secure and time-limited. No account is created.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
