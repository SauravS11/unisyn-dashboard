import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, ArrowRight } from "lucide-react";

export const DealCodeCard = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (code.length !== 5) {
      toast.error("Please enter a 5-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deals")
        .select("id, name")
        .eq("passcode", code)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("Invalid code. Please check and try again.");
        return;
      }

      // Store the passcode in sessionStorage for the external dashboard to use
      sessionStorage.setItem("deal_passcode", code);
      sessionStorage.setItem("deal_id", data.id);
      
      toast.success(`Accessing ${data.name}`);
      navigate(`/external/deals/${data.id}/dashboard`);
    } catch (error) {
      console.error("Error verifying code:", error);
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
          Enter Deal Code
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Enter the 5-digit code shared with you to access the deal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={5}
            value={code}
            onChange={(value) => setCode(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          className="w-full h-11 sm:h-12 text-base font-semibold gap-2"
          onClick={handleSubmit}
          disabled={isLoading || code.length !== 5}
        >
          {isLoading ? "Verifying..." : "Access Deal"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};