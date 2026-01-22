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
  const [dealId, setDealId] = useState("");
  const [step, setStep] = useState<"dealId" | "passcode">("dealId");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitDealId = () => {
    const trimmedDealId = dealId.trim();
    
    // Check if it's empty
    if (!trimmedDealId) {
      toast.error("Please enter a deal ID");
      return;
    }
    
    // Accept either UUID format or alphanumeric deal codes (6-20 characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dealCodeRegex = /^[a-zA-Z0-9]{6,20}$/;
    
    if (!uuidRegex.test(trimmedDealId) && !dealCodeRegex.test(trimmedDealId)) {
      toast.error("Please enter a valid deal ID (UUID or 6-20 character code)");
      return;
    }
    
    setStep("passcode");
  };

  const handleSubmitPasscode = async () => {
    if (code.length !== 5) {
      toast.error("Please enter a 5-digit code");
      return;
    }

    setIsLoading(true);
    try {
      // Call the secure edge function to verify passcode
      const { data, error } = await supabase.functions.invoke("verify-passcode", {
        body: {
          dealId: dealId.trim(),
          passcode: code,
        },
      });

      if (error) {
        console.error("Error verifying passcode:", error);
        toast.error("Failed to verify passcode. Please try again.");
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || "Invalid passcode. Please check and try again.");
        return;
      }

      // Store the access token (NOT the passcode) in sessionStorage
      sessionStorage.setItem("deal_access_token", data.accessToken);
      sessionStorage.setItem("deal_id", data.dealId);
      
      toast.success("Access granted!");
      navigate(`/external/deals/${data.dealId}/dashboard`);
    } catch (error) {
      console.error("Error verifying passcode:", error);
      toast.error("Failed to verify passcode. Please try again.");
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
          {step === "dealId" ? "Enter Deal ID" : "Enter Passcode"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {step === "dealId" 
            ? "Enter the deal ID shared with you" 
            : "Enter the 5-digit passcode to access the deal"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {step === "dealId" ? (
          <>
            <div className="flex justify-center">
              <input
                type="text"
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                placeholder="Enter your deal ID or code"
                className="w-full px-4 py-3 rounded-lg bg-background/50 border border-border/50 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <Button 
              className="w-full h-11 sm:h-12 text-base font-semibold gap-2"
              onClick={handleSubmitDealId}
              disabled={!dealId.trim()}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <>
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

            <div className="flex gap-2">
              <Button 
                variant="outline"
                className="flex-1 h-11 sm:h-12"
                onClick={() => {
                  setStep("dealId");
                  setCode("");
                }}
              >
                Back
              </Button>
              <Button 
                className="flex-1 h-11 sm:h-12 text-base font-semibold gap-2"
                onClick={handleSubmitPasscode}
                disabled={isLoading || code.length !== 5}
              >
                {isLoading ? "Verifying..." : "Access Deal"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
