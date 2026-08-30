import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageShell } from "@/components/ui/page-shell";
import { GlassIcon } from "@/components/ui/glass-icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, ArrowRight, FileText, MessageSquareText, ListChecks } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { fetchWorkflowChecklist, type WorkflowSection } from "@/lib/incubatorClient";
import { toast } from "sonner";

const ChecklistPreview = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState<WorkflowSection[]>([]);
  const [app, setApp] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, application_code, business_name, funding_workflow_id, funding_workflows(name, code_prefix)")
        .eq("id", applicationId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Application not found");
        return;
      }
      setApp(data);
      setSections(await fetchWorkflowChecklist(data.funding_workflow_id));
    })();
  }, [applicationId]);

  const totalReqs = sections.reduce((n, s) => n + (s.requirements?.length ?? 0), 0);

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Button variant="ghost" className="rounded-full gap-2 mb-6" onClick={() => navigate(`/incubator/applications/${applicationId}/profile`)}>
          <ArrowLeft className="h-4 w-4" /> Back to Applicant Profile
        </Button>

        <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground mb-3">Step 3 of 4</p>
        <h1 className="font-display text-4xl tracking-tight mb-2">Generated Application Checklist</h1>
        <p className="text-muted-foreground mb-8">
          {app?.funding_workflows?.name} — {sections.length} sections · {totalReqs} requirements. This is exactly what
          your applicant will complete.
        </p>

        <div className="glass-surface p-6 mb-6 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Applicant</p>
            <p className="font-semibold">{app?.business_name}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Application Code</p>
            <p className="font-mono text-sm">{app?.application_code}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sections</p>
            <p className="font-semibold">{sections.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Requirements</p>
            <p className="font-semibold">{totalReqs}</p>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {sections.map((s) => {
            const docs = (s.requirements ?? []).filter((r) => r.input_type !== "response").length;
            const qs = (s.requirements ?? []).length - docs;
            return (
              <AccordionItem key={s.id} value={s.id} className="glass-surface px-5 border">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <GlassIcon icon={s.section_code === "G" ? FileText : ListChecks} size="md" />
                    <div>
                      <p className="font-display text-lg leading-tight">
                        {s.section_code} — {s.section_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {qs} guided questions · {docs} documents
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pb-2">
                    {(s.requirements ?? []).map((r) => (
                      <li key={r.id} className="flex items-start gap-3 text-sm">
                        <Badge variant="outline" className="font-mono text-[10px] rounded-full shrink-0">
                          {s.section_code}
                          {r.sort_order}
                        </Badge>
                        <span className="flex-1">{r.requirement_text}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1 shrink-0">
                          {r.input_type === "response" ? (
                            <>
                              <MessageSquareText className="h-3 w-3" /> Response
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" /> Document
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/incubator/applications")}>
            Save Draft
          </Button>
          <Button
            className="rounded-full gap-2"
            onClick={() => navigate(`/incubator/applications/${applicationId}/send`)}
          >
            Continue to Send Request <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageShell>
  );
};

export default ChecklistPreview;
