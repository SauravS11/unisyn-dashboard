// Helper utilities for the respondent portal (no auth — uses a session-stored token)
import { supabase } from "@/integrations/supabase/customClient";

const KEY_TOKEN = "intake_access_token";
const KEY_INTAKE_ID = "intake_id";
const KEY_INTAKE_CODE = "intake_code";

export function getIntakeSession() {
  return {
    accessToken: sessionStorage.getItem(KEY_TOKEN),
    intakeId: sessionStorage.getItem(KEY_INTAKE_ID),
    intakeCode: sessionStorage.getItem(KEY_INTAKE_CODE),
  };
}

export function setIntakeSession(opts: { accessToken: string; intakeId: string; intakeCode: string }) {
  sessionStorage.setItem(KEY_TOKEN, opts.accessToken);
  sessionStorage.setItem(KEY_INTAKE_ID, opts.intakeId);
  sessionStorage.setItem(KEY_INTAKE_CODE, opts.intakeCode);
}

export function clearIntakeSession() {
  sessionStorage.removeItem(KEY_TOKEN);
  sessionStorage.removeItem(KEY_INTAKE_ID);
  sessionStorage.removeItem(KEY_INTAKE_CODE);
}

export async function submitResponse(opts: {
  requirementId: string;
  responseValue?: string | null;
  yesNo?: boolean | null;
  applicableStatus?: "applicable" | "not_applicable" | null;
  comment?: string | null;
}) {
  const { accessToken, intakeId } = getIntakeSession();
  if (!accessToken || !intakeId) throw new Error("Session expired");
  const { data, error } = await supabase.functions.invoke("submit-intake-response", {
    body: { intakeId, accessToken, ...opts },
  });
  if (error) throw error;
  return data;
}

export async function registerDocument(opts: {
  requirementId: string;
  fileName: string;
  fileUrl: string;
  fileType?: string | null;
  fileSize?: number | null;
  uploadComment?: string | null;
  uploadedByEmail?: string | null;
}) {
  const { accessToken, intakeId } = getIntakeSession();
  if (!accessToken || !intakeId) throw new Error("Session expired");
  const { data, error } = await supabase.functions.invoke("register-intake-document", {
    body: { intakeId, accessToken, ...opts },
  });
  if (error) throw error;
  return data;
}
