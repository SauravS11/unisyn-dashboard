import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/customClient";
import { getIntakeSession, registerDocument } from "@/lib/intakeClient";
import { RespondentHeader } from "@/components/RespondentHeader";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Save, FileText } from "lucide-react";

interface Req {
  id: string;
  requirement_code: string;
  requirement_text: string;
  input_type: "document_upload" | "document_upload_with_comment" | string;
}

export default function CategoryPart2() {
  const { intakeId, categoryCode } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<any>(null);
  const [intakeMeta, setIntakeMeta] = useState<{ intake_code?: string; company_name?: string }>({});
  const [reqs, setReqs] = useState<Req[]>([]);
  const [uploaded, setUploaded] = useState<Record<string, any[]>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<string[]>([]);

  const loadDetail = async () => {
    const session = getIntakeSession();
    const { data, error } = await supabase.rpc("get_intake_category_detail", {
      p_intake_id: intakeId,
      p_token: session.accessToken,
      p_category_code: categoryCode,
    });
    if (error) throw error;
    const payload = data as any;
    setCategory(payload?.category);
    const allReqs: Req[] = payload?.requirements ?? [];
    setReqs(allReqs.filter((r) => ["document_upload","document_upload_with_comment"].includes(r.input_type)));
    const grouped: Record<string, any[]> = {};
    (payload?.documents ?? []).forEach((d: any) => {
      grouped[d.requirement_id] ??= [];
      grouped[d.requirement_id].push(d);
    });
    setUploaded(grouped);
  };

  useEffect(() => {
    const session = getIntakeSession();
    if (!session.accessToken || session.intakeId !== intakeId) { navigate("/respond"); return; }
    setIntakeMeta({ intake_code: session.intakeCode ?? undefined });
    (async () => {
      const { data: overview } = await supabase.rpc("get_intake_overview", {
        p_intake_id: intakeId,
        p_token: session.accessToken,
      });
      setOrder(((overview as any)?.categories ?? []).map((c: any) => c.category_code));
    })();
    loadDetail()
      .catch((e) => { toast.error(e.message ?? "Failed"); navigate(`/respond/${intakeId}`); })
      .finally(() => setLoading(false));
  }, [intakeId, categoryCode, navigate]);

  const idx = order.indexOf(categoryCode ?? "");
  const isLast = idx >= 0 && idx === order.length - 1;
  const nextCode = !isLast && idx >= 0 ? order[idx + 1] : null;

  const onFile = async (req: Req, files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const path = `${intakeId}/${req.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("intake-documents").upload(path, file);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("intake-documents").createSignedUrl(path, 60 * 60 * 24 * 365);
        await registerDocument({
          requirementId: req.id,
          fileName: file.name,
          fileUrl: signed?.signedUrl ?? path,
          fileType: file.type,
          fileSize: file.size,
          uploadComment: comments[req.id] ?? null,
        });
      }
      toast.success("Uploaded");
      await loadDetail();
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally { setBusy(false); }
  };

  const submitCategory = async () => {
    if (!category) return;
    setBusy(true);
    try {
      const session = getIntakeSession();
      const { error } = await supabase.rpc("submit_intake_category", {
        p_intake_id: intakeId,
        p_token: session.accessToken,
        p_category_id: category.id,
      });
      if (error) throw error;
      toast.success("Category submitted");
      navigate(`/respond/${intakeId}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setBusy(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <RespondentHeader intakeCode={intakeMeta.intake_code} companyName={intakeMeta.company_name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/respond/${intakeId}/category/${categoryCode}/part-1`)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Part 1
        </Button>
        <Card className="backdrop-blur-xl bg-card/70 border-border/50 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">
              <span className="text-destructive font-bold mr-2">{categoryCode}</span>
              {category?.category_name} — Part 2: Documents &amp; Supporting Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {reqs.length === 0 && <p className="text-sm text-muted-foreground">No documents required for this category.</p>}
            {reqs.map((r) => (
              <div key={r.id} className="rounded-lg border border-border/50 bg-card/40 p-4 space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-destructive tabular-nums">{r.requirement_code}</span>
                  <p className="font-medium text-sm">{r.requirement_text}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="file" multiple onChange={(e) => onFile(r, e.target.files)} disabled={busy} />
                </div>
                {r.input_type === "document_upload_with_comment" && (
                  <Textarea rows={2} placeholder="Optional comment for the next upload"
                    value={comments[r.id] ?? ""}
                    onChange={(e) => setComments((c) => ({ ...c, [r.id]: e.target.value }))} />
                )}
                {uploaded[r.id]?.length > 0 && (
                  <ul className="space-y-1">
                    {uploaded[r.id].map((d) => (
                      <li key={d.id} className="text-xs flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3 w-3" /> {d.file_name}
                        {d.upload_comment && <span className="italic">— {d.upload_comment}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" className="gap-2" onClick={() => navigate(`/respond/${intakeId}`)} disabled={busy}>
                <Save className="h-4 w-4" /> Save Draft
              </Button>
              <Button className="gap-2 sm:ml-auto" onClick={submitCategory} disabled={busy}>
                <CheckCircle2 className="h-4 w-4" /> Submit Category
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
