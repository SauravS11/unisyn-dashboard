import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Key, Copy, Check } from "lucide-react";
import { passcodeSchema } from "@/lib/validation";
import { handleError } from "@/lib/errorHandler";

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
  currentPasscode,
  onPasscodeUpdate 
}: PasscodeDialogProps) => {
  const [passcode, setPasscode] = useState(currentPasscode || "");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = async () => {
    // Validate passcode contains only digits
    const validationResult = passcodeSchema.safeParse(passcode);
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0]?.message || "Invalid passcode format");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("deals")
        .update({ passcode: validationResult.data })
        .eq("id", dealId);

      if (error) throw error;

      toast.success("Passcode saved successfully");
      onPasscodeUpdate();
      onClose();
    } catch (error) {
      const { message } = handleError("saving passcode", error);
      toast.error(message);
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
      const { message } = handleError("removing passcode", error);
      toast.error(message);
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
            Deal Access Credentials
          </DialogTitle>
          <DialogDescription>
            Set a 6-digit passcode for "{dealName}". Share both the Deal ID and passcode with external users to grant access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Deal Code Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Deal Code (share this with external users)</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-muted font-mono text-sm break-all">
                {dealCode}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(dealCode);
                  toast.success("Deal Code copied to clipboard");
                }}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Passcode Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">6-Digit Passcode</label>
            <div className="flex flex-col items-center gap-4">
              <InputOTP
                maxLength={6}
                value={passcode}
                onChange={(value) => setPasscode(value)}
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

              {passcode.length === 6 && (
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
          </div>

          {/* Copy Both Button */}
          {passcode.length === 6 && (
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => {
                const accessInfo = `Deal Code: ${dealCode}\nPasscode: ${passcode}`;
                navigator.clipboard.writeText(accessInfo);
                toast.success("Deal Code and Passcode copied to clipboard");
              }}
            >
              <Copy className="h-4 w-4" />
              Copy Both (Deal Code + Passcode)
            </Button>
          )}

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
              disabled={isLoading || passcode.length !== 6}
            >
              {isLoading ? "Saving..." : "Save Passcode"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};