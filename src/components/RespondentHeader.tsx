import unisynLogo from "@/assets/unisyn-logo.svg";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CircleHelp, X } from "lucide-react";
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
    <header className="sticky top-0 z-30 backdrop-glass bg-background/70 border-b border-border/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src={unisynLogo} alt="UniSyn" className="w-28 h-auto flex-shrink-0" />
          <div className="hidden sm:block min-w-0 pl-3 border-l border-border/50">
            <p className="text-sm font-semibold truncate leading-tight">{companyName ?? "Pre-Due Diligence Request"}</p>
            <p className="text-[11px] font-mono tracking-wider text-muted-foreground">{intakeCode ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden md:flex items-center gap-2 w-48">
            <Progress value={completion} className="h-1.5" />
            <span className="text-xs font-semibold tabular-nums text-foreground">{Math.round(completion)}%</span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 rounded-full">
            <CircleHelp className="h-4 w-4" /> Help
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-full backdrop-glass bg-card/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
            onClick={exit}
          >
            <X className="h-4 w-4" /> Exit
          </Button>
        </div>
      </div>
    </header>
  );
};
