import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, AlertCircle, FileSearch, MessageCircleQuestion, ShieldAlert } from "lucide-react";

const items = [
  { icon: AlertCircle, label: "Missing information flags", note: "MIA will surface required-but-empty items here." },
  { icon: FileSearch, label: "Document summary", note: "Auto-generated overview of submitted documents." },
  { icon: ShieldAlert, label: "Inconsistency flags", note: "Cross-checks across Part 1 and Part 2 responses." },
  { icon: MessageCircleQuestion, label: "Suggested advisor questions", note: "Smart follow-up questions to ask the respondent." },
  { icon: ShieldAlert, label: "Risk notes", note: "Highlighted risk areas by category." },
];

export const MiaInsights = ({ title = "MIA Insights" }: { title?: string }) => (
  <Card className="backdrop-blur-xl bg-card/60 border-border/50 shadow-2xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Sparkles className="h-5 w-5 text-primary" />
        {title}
        <span className="ml-2 text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          Coming soon
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {items.map(({ icon: Icon, label, note }) => (
        <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
          <Icon className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);
