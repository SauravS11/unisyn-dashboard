import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/customClient";
import { setIntakeSession } from "@/lib/intakeClient";
import { toast } from "sonner";
import { Key, ArrowRight } from "lucide-react";

export const DealCodeCard = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      toast.error("Please enter your access code");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_intake_code", {
        p_code: trimmed,
      });

      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row?.success) {
        toast.error(row?.message || error?.message || "Invalid code. Please check and try again.");
        return;
      }

      setIntakeSession({
        accessToken: row.access_token,
        intakeId: row.intake_id,
        intakeCode: row.intake_code,
      });

      toast.success("Access granted!");
      navigate(`/respond/${row.intake_id}`);
    } catch (err) {
      console.error("Error verifying access code:", err);
      toast.error("Failed to verify code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
      <CardHeader className="space-y-1 text-center pb-4 sm:pb-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          Client Access
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Enter the secure code your advisor shared with you. No sign-up required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="intake-code">Access Code</Label>
          <Input
            id="intake-code"
            placeholder="USYN-2026-0001"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="font-mono tracking-wider text-center text-base h-12 bg-background/50 border-border/50"
            autoFocus
          />
        </div>

        <Button
          className="w-full h-11 sm:h-12 text-base font-semibold gap-2"
          onClick={handleSubmit}
          disabled={isLoading || !code.trim()}
        >
          {isLoading ? "Verifying..." : "Access Request"}
          <ArrowRight className="h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Your session is secure and time-limited.
        </p>
      </CardContent>
    </Card>
  );
};
