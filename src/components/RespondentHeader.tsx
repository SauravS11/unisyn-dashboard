import unisynLogo from "@/assets/unisyn-logo.svg";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearIntakeSession } from "@/lib/intakeClient";

interface Props {
  intakeCode?: string | null;
  companyName?: string | null;
  completion?: number;
}

export const RespondentHeader = ({ intakeCode, companyName, completion = 0 }: Props) => {
  const navigate = useNavigate();
  const exit = () => {
    clearIntakeSession();
    navigate("/auth");
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src={unisynLogo} alt="UniSyn" className="w-28 h-auto flex-shrink-0" />
          <div className="hidden sm:block min-w-0">
            <p className="text-sm font-semibold truncate">{companyName ?? "Pre-Due Diligence Request"}</p>
            <p className="text-xs text-muted-foreground">Code: {intakeCode ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 w-40">
            <Progress value={completion} className="h-2" />
            <span className="text-xs font-medium tabular-nums">{Math.round(completion)}%</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1">
            <HelpCircle className="h-4 w-4" /> Help
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={exit}>
            <LogOut className="h-4 w-4" /> Exit
          </Button>
        </div>
      </div>
    </header>
  );
};
