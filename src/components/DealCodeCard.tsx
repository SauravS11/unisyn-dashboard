import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { Key, ArrowRight } from "lucide-react";

export const DealCodeCard = () => {
  const navigate = useNavigate();
  const [dealCode, setDealCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (dealCode.length !== 6) {
      toast.error("Please enter a 6-digit deal code");
      return;
    }

    setIsLoading(true);
    try {
      // Call the secure edge function to verify deal code
      const { data, error } = await supabase.functions.invoke("verify-passcode", {
        body: {
          dealCode: dealCode,
        },
      });

      if (error) {
        console.error("Error verifying deal code:", error);
        toast.error("Failed to verify deal code. Please try again.");
        return;
      }

      if (!data?.success) {
        toast.error(data?.message || "Invalid deal code. Please check and try again.");
        return;
      }

      // Store the access token in sessionStorage
      sessionStorage.setItem("deal_access_token", data.accessToken);
      sessionStorage.setItem("deal_id", data.dealId);
      
      toast.success("Access granted!");
      navigate(`/external/deals/${data.dealId}/dashboard`);
    } catch (error) {
      console.error("Error verifying deal code:", error);
      toast.error("Failed to verify deal code. Please try again.");
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
          Enter the 6-digit code shared with you to access the deal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={dealCode}
            onChange={(value) => setDealCode(value)}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button 
          className="w-full h-11 sm:h-12 text-base font-semibold gap-2"
          onClick={handleSubmit}
          disabled={isLoading || dealCode.length !== 6}
        >
          {isLoading ? "Verifying..." : "Access Deal"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};