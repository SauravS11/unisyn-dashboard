import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Copy, Check } from "lucide-react";

interface PasscodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  dealName: string;
  currentPasscode?: string | null;
  onPasscodeUpdate: () => void;
}

export const PasscodeDialog = ({ 
  isOpen, 
  onClose, 
  dealId, 
  dealName, 
  currentPasscode,
  onPasscodeUpdate 
}: PasscodeDialogProps) => {
  const [passcode, setPasscode] = useState(currentPasscode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    if (passcode.length !== 5) {
      toast.error("Passcode must be exactly 5 digits");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("deals")
        .update({ passcode })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Passcode saved successfully");
      onPasscodeUpdate();
      onClose();
    } catch (error) {
      console.error("Error saving passcode:", error);
      toast.error("Failed to save passcode");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("deals")
        .update({ passcode: null })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Passcode removed");
      setPasscode("");
      onPasscodeUpdate();
      onClose();
    } catch (error) {
      console.error("Error removing passcode:", error);
      toast.error("Failed to remove passcode");
    } finally {
      setIsLoading(false);
    }
  };

  const copyPasscode = () => {
    navigator.clipboard.writeText(passcode);
    setCopied(true);
    toast.success("Passcode copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Deal Passcode
          </DialogTitle>
          <DialogDescription>
            Set a 5-digit passcode for "{dealName}" to allow external users to view this deal without signing in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={5}
              value={passcode}
              onChange={(value) => setPasscode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
              </InputOTPGroup>
            </InputOTP>

            {passcode.length === 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyPasscode}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Passcode
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {currentPasscode && (
              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={isLoading}
              >
                Remove Passcode
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={isLoading || passcode.length !== 5}
            >
              {isLoading ? "Saving..." : "Save Passcode"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};