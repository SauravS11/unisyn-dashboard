// Incubators & Accelerators — data helpers.
// Separate from the M&A intake helpers in intakeClient.ts.
import { supabase } from "@/integrations/supabase/customClient";

const KEY_TOKEN = "application_access_token";
const KEY_ID = "application_id";
const KEY_CODE = "application_code";

export interface FundingWorkflow {
  id: string;
  name: string;
  slug: string;
  code_prefix: string;
  description: string | null;
  sort_order: number;
}

export interface WorkflowRequirement {
  id: string;
  requirement_code: string;
  requirement_text: string;
  input_type: "response" | "document" | "hybrid";
  is_required: boolean;
  sort_order: number;
}

export interface WorkflowSection {
  id: string;
  section_code: string;
  section_name: string;
  sort_order: number;
  requirements?: WorkflowRequirement[];
}

export function getApplicationSession() {
  return {
    accessToken: sessionStorage.getItem(KEY_TOKEN),
    applicationId: sessionStorage.getItem(KEY_ID),
    applicationCode: sessionStorage.getItem(KEY_CODE),
  };
}

export function setApplicationSession(o: { accessToken: string; applicationId: string; applicationCode: string }) {
  sessionStorage.setItem(KEY_TOKEN, o.accessToken);
  sessionStorage.setItem(KEY_ID, o.applicationId);
  sessionStorage.setItem(KEY_CODE, o.applicationCode);
}

export function clearApplicationSession() {
  [KEY_TOKEN, KEY_ID, KEY_CODE].forEach((k) => sessionStorage.removeItem(k));
}

export async function fetchWorkflows(): Promise<FundingWorkflow[]> {
  const { data, error } = await supabase
    .from("funding_workflows")
    .select("id, name, slug, code_prefix, description, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as FundingWorkflow[];
}

export async function fetchWorkflowChecklist(workflowId: string): Promise<WorkflowSection[]> {
  const { data, error } = await supabase
    .from("funding_workflow_sections")
    .select(
      "id, section_code, section_name, sort_order, funding_workflow_requirements(id, requirement_code, requirement_text, input_type, is_required, sort_order)",
    )
    .eq("funding_workflow_id", workflowId)
    .order("sort_order");
  if (error) throw error;
  return ((data ?? []) as any[]).map((s) => ({
    id: s.id,
    section_code: s.section_code,
    section_name: s.section_name,
    sort_order: s.sort_order,
    requirements: (s.funding_workflow_requirements ?? []).sort(
      (a: WorkflowRequirement, b: WorkflowRequirement) => a.sort_order - b.sort_order,
    ),
  }));
}

/* ---------- applicant portal (token based) ---------- */

export async function verifyApplicationCode(code: string) {
  const { data, error } = await supabase.rpc("verify_application_code", {
    p_code: code.trim(),
    p_ip: null,
    p_user_agent: navigator.userAgent,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return row as {
    success: boolean;
    message: string;
    access_token: string | null;
    application_id: string | null;
    application_code: string | null;
  };
}

function session() {
  const { accessToken, applicationId } = getApplicationSession();
  if (!accessToken || !applicationId) throw new Error("Session expired. Please re-enter your application code.");
  return { accessToken, applicationId };
}

export async function getApplicationOverview() {
  const { accessToken, applicationId } = session();
  const { data, error } = await supabase.rpc("get_application_overview", {
    p_application_id: applicationId,
    p_token: accessToken,
  });
  if (error) throw error;
  return data as any;
}

export async function getApplicationSection(sectionCode: string) {
  const { accessToken, applicationId } = session();
  const { data, error } = await supabase.rpc("get_application_section", {
    p_application_id: applicationId,
    p_token: accessToken,
    p_section_code: sectionCode,
  });
  if (error) throw error;
  return data as any;
}

export async function saveApplicationResponse(requirementId: string, value: string, comment?: string | null) {
  const { accessToken, applicationId } = session();
  const { error } = await supabase.rpc("save_application_response", {
    p_application_id: applicationId,
    p_token: accessToken,
    p_requirement_id: requirementId,
    p_response_value: value,
    p_comment: comment ?? null,
  });
  if (error) throw error;
}

export async function uploadApplicationDocument(opts: {
  requirementId: string;
  file: File;
  comment?: string | null;
  email?: string | null;
  replacesDocumentId?: string | null;
}) {
  const { accessToken, applicationId } = session();
  const path = `${applicationId}/${opts.requirementId}/${Date.now()}-${opts.file.name}`;
  const { error: upErr } = await supabase.storage.from("application-documents").upload(path, opts.file);
  if (upErr) throw upErr;
  const { error } = await supabase.rpc("register_application_document", {
    p_application_id: applicationId,
    p_token: accessToken,
    p_requirement_id: opts.requirementId,
    p_file_name: opts.file.name,
    p_file_url: path,
    p_file_type: opts.file.type,
    p_file_size: opts.file.size,
    p_upload_comment: opts.comment ?? null,
    p_uploaded_by_email: opts.email ?? null,
    p_replaces_document_id: opts.replacesDocumentId ?? null,
  });
  if (error) throw error;
}

export async function submitSection(sectionId: string) {
  const { accessToken, applicationId } = session();
  const { error } = await supabase.rpc("submit_application_section", {
    p_application_id: applicationId,
    p_token: accessToken,
    p_section_id: sectionId,
  });
  if (error) throw error;
}

export async function submitClarificationUpdate(clarificationId: string, response: string) {
  const { accessToken, applicationId } = session();
  const { error } = await supabase.rpc("resolve_application_clarification", {
    p_application_id: applicationId,
    p_token: accessToken,
    p_clarification_id: clarificationId,
    p_response: response,
  });
  if (error) throw error;
}

export async function openApplicationDocument(filePath: string) {
  const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(filePath, 300);
  if (error) throw error;
  if (data?.signedUrl) window.open(data.signedUrl, "_blank");
}

export const sectionCompletion = (s: {
  total: number;
  responses_done: number;
  documents_done: number;
  response_total: number;
  document_total: number;
}) => {
  const total = (s.response_total ?? 0) + (s.document_total ?? 0);
  if (!total) return 0;
  const done = (s.responses_done ?? 0) + (s.documents_done ?? 0);
  return Math.min(100, Math.round((done / total) * 100));
};
