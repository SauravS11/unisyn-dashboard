import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/customClient";
import { toast } from "sonner";
import { Key, Copy, Check, RefreshCw } from "lucide-react";

interface PasscodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealCode: string;
  dealName: string;
  currentPasscode?: string | null;
  onPasscodeUpdate: () => void;
}

export const PasscodeDialog = ({ 
  isOpen, 
  onClose, 
  dealId, 
  dealCode,
  dealName, 
  onPasscodeUpdate 
}: PasscodeDialogProps) => {
  const [code, setCode] = useState(dealCode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCode(dealCode || "");
  }, [dealCode]);

  const generateRandomCode = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(newCode);
  };

  const handleSave = async () => {
    // Validate code is exactly 6 digits
    if (!/^\d{6}$/.test(code)) {
      toast.error("Deal code must be exactly 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      // Check if code is already used by another deal
      const { data: existingDeal } = await supabase
        .from("deals")
        .select("id")
        .eq("deal_code", code)
        .neq("id", dealId)
        .maybeSingle();

      if (existingDeal) {
        toast.error("This deal code is already in use. Please choose a different one.");
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from("deals")
        .update({ deal_code: code })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Deal code saved successfully");
      onPasscodeUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving deal code:", error);
      toast.error("Failed to save deal code");
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Deal code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Deal Access Code
          </DialogTitle>
          <DialogDescription>
            Set a 6-digit code for "{dealName}". Share this code with external users to grant access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deal Code Input */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-muted-foreground">6-Digit Deal Code</label>
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={(value) => setCode(value)}
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

              <Button
                variant="outline"
                size="sm"
                onClick={generateRandomCode}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Random Code
              </Button>
            </div>
          </div>

          {/* Copy Button */}
          {code.length === 6 && (
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={copyCode}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Deal Code
                </>
              )}
            </Button>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? "Saving..." : "Save Code"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};