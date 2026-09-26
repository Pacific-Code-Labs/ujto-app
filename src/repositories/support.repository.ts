// Client for the support API (support.<domain>, ujto-support-be). Same Cognito ID token as the
// main API; the path owner must be the signed-in user.
import { ApiError, authHeader, toApiError } from "@/lib/api";
import { SUPPORT_API_URL } from "@/lib/config";

export interface SupportMessage {
  id: string;
  author_user_id: string;
  is_staff: boolean;
  body: string;
  created_at: string | null;
}

export interface SupportEvidence {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  created_at: string | null;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: string;
  incident_reference: string | null;
  created_at: string | null;
  updated_at: string | null;
  messages?: SupportMessage[];
  evidence?: SupportEvidence[];
}

export interface NewTicket {
  subject: string;
  description: string;
  category: string;
  incident_reference?: string;
  context?: Record<string, string>;
}

export const EVIDENCE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 5;

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const send = async (forceRefresh: boolean) =>
    fetch(`${SUPPORT_API_URL}${path}`, {
      method,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(await authHeader(forceRefresh)) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  let res = await send(false);
  if (res.status === 401) res = await send(true);
  if (!res.ok) throw await toApiError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const base = (userId: string) => `/api/users/${encodeURIComponent(userId)}/support/tickets`;

export const supportRepository = {
  list: (userId: string) => call<SupportTicket[]>("GET", base(userId)),
  get: (userId: string, id: string) => call<SupportTicket>("GET", `${base(userId)}/${id}`),
  create: (userId: string, ticket: NewTicket) => call<SupportTicket>("POST", base(userId), ticket),
  reply: (userId: string, id: string, body: string) => call<SupportMessage>("POST", `${base(userId)}/${id}/messages`, { body }),
  evidenceUrl: (userId: string, id: string, evidenceId: string) =>
    call<{ download_url: string }>("GET", `${base(userId)}/${id}/evidence/${evidenceId}/download`),

  /** Presigned PUT straight to the private evidence bucket, then confirm. */
  async attach(userId: string, id: string, file: File): Promise<SupportEvidence> {
    const target = await call<{ id: string; upload_url: string; headers: Record<string, string> }>(
      "POST", `${base(userId)}/${id}/evidence`, { file_name: file.name, content_type: file.type, size_bytes: file.size });
    const res = await fetch(target.upload_url, { method: "PUT", headers: target.headers, body: file });
    if (!res.ok) throw new ApiError(res.status, "Upload failed");
    return call<SupportEvidence>("POST", `${base(userId)}/${id}/evidence/${target.id}/complete`);
  },
};
