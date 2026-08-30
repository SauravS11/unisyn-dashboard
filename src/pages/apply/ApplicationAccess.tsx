import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import unisynLogo from "@/assets/unisyn-logo.svg";
import { KeyRound, ShieldCheck } from "lucide-react";
import { setApplicationSession, verifyApplicationCode } from "@/lib/incubatorClient";
import { toast } from "sonner";

const ApplicationAccess = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyApplicationCode(code);
      if (!res?.success || !res.access_token || !res.application_id) {
        toast.error(res?.message ?? "Invalid application code");
        return;
      }
      setApplicationSession({
        accessToken: res.access_token,
        applicationId: res.application_id,
        applicationCode: res.application_code ?? code,
      });
      navigate(`/apply/${res.application_id}`);
    } catch (err: any) {
      toast.error(err.message ?? "Could not verify the application code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-14">
        <img src={unisynLogo} alt="UniSyn" className="w-44 h-auto mb-8 drop-shadow-2xl" />
        <div className="text-center mb-8 max-w-md">
          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Funding Application Portal</p>
          <h1 className="font-display text-4xl tracking-tight">
            Access your <span className="text-gradient-brand">application</span>
          </h1>
          <p className="text-muted-foreground mt-3">
            Enter the application code from your invitation. No account or password is required.
          </p>
        </div>

        <form onSubmit={submit} className="glass-surface-strong p-6 w-full max-w-md space-y-5">
          <div className="flex items-center gap-4">
            <GlassIcon icon={KeyRound} size="lg" />
            <div>
              <p className="font-semibold">Application Code</p>
              <p className="text-xs text-muted-foreground">For example BUSFIN-2026-0001</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code" className="text-xs uppercase tracking-wider text-muted-foreground">
              Enter code
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="BUSFIN-2026-0001"
              className="font-mono tracking-wider"
              required
            />
          </div>
          <Button type="submit" className="w-full rounded-full" disabled={loading}>
            {loading ? "Verifying…" : "Open my application"}
          </Button>
          <div className="flex items-start gap-3 pt-2 border-t border-border/50">
            <GlassIcon icon={ShieldCheck} size="sm" tone="success" />
            <p className="text-xs text-muted-foreground">
              Secure. Private. No sign-up required. Your progress is saved as you go.
            </p>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default ApplicationAccess;
