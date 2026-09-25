// Typed client for the Ujtö̀ API (Pacific-Code-Labs/ujto-be).
// The API speaks snake_case; this module maps responses to the camelCase shapes the UI uses.
import { fetchAuthSession } from "aws-amplify/auth";
import { API_BASE_URL } from "./config";
import type { Notification, Transcription } from "./api-types";
import type { UserResponse } from "./auth-schema";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authHeader(forceRefresh = false): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession({ forceRefresh });
    const idToken = session.tokens?.idToken?.toString();
    return idToken ? { Authorization: `Bearer ${idToken}` } : {};
  } catch {
    return {};
  }
}

/** Authenticated request returning the raw Response (refreshes the ID token once on 401). */
async function authorizedFetch(method: string, path: string, body?: unknown): Promise<Response> {
  const send = async (forceRefresh: boolean) =>
    fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(await authHeader(forceRefresh)),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await send(false);
  if (res.status === 401) res = await send(true); // expired ID token: refresh once
  return res;
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  try {
    const data = await res.json();
    message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? data);
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(res.status, message || `HTTP ${res.status}`);
}

export async function apiFetch<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await authorizedFetch(method, path, body);
  if (!res.ok) {
    throw await toApiError(res);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// ---- API DTOs (snake_case, as returned by the backend) ----
interface ProfileDto {
  owner_id: string;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  language_preference: string;
  subscription_tier: string;
  transcriptions_used: number;
  created_on: string | null;
  updated_on: string | null;
}

interface TranscriptionDto {
  transcription_id: string;
  owner_id: string;
  video_url: string | null;
  source_type?: string;
  original_filename?: string | null;
  video_title: string | null;
  transcript: string | null;
  transcription_status: string;
  duration: string | number | null;
  word_count: number | null;
  processing_time: string | number | null;
  accuracy: string | number | null;
  error_message: string | null;
  segments?: { start: number; end: number; text: string }[] | null;
  created_on: string | null;
}

interface NotificationDto {
  notification_id: string;
  owner_id: string;
  type: string;
  title: string;
  message: string;
  related_id: string | null;
  is_read: boolean;
  created_on: string | null;
}

interface Page<T> {
  data: T[];
  pagination: { page: number; page_size: number; total_elements: number; total_pages: number };
}

const num = (v: string | number | null) => (v === null || v === undefined ? 0 : Number(v));
const date = (v: string | null) => (v ? new Date(v) : null);

function toUser(d: ProfileDto): UserResponse {
  return {
    id: d.owner_id,
    username: d.username,
    email: d.email,
    firstName: d.first_name ?? undefined,
    lastName: d.last_name ?? undefined,
    subscriptionTier: d.subscription_tier,
    transcriptionsUsed: d.transcriptions_used,
    isEmailVerified: d.email_verified,
    isPro: d.subscription_tier !== "free",
    languagePreference: d.language_preference,
    createdAt: date(d.created_on) ?? undefined,
    updatedAt: date(d.updated_on) ?? undefined,
  };
}

export function toTranscription(d: TranscriptionDto): Transcription {
  return {
    id: d.transcription_id,
    userId: d.owner_id,
    videoUrl: d.video_url ?? "",
    sourceType: d.source_type === "upload" ? "upload" : "url",
    originalFilename: d.original_filename ?? undefined,
    videoTitle: d.video_title ?? undefined,
    transcript: d.transcript ?? "",
    status: d.transcription_status,
    duration: num(d.duration),
    wordCount: d.word_count ?? 0,
    processingTime: num(d.processing_time),
    accuracy: num(d.accuracy),
    errorMessage: d.error_message ?? undefined,
    segments: d.segments ?? [],
    createdAt: d.created_on ?? "",
  };
}

function toNotification(d: NotificationDto): Notification {
  return {
    id: d.notification_id,
    userId: d.owner_id,
    type: d.type,
    title: d.title,
    message: d.message,
    relatedId: d.related_id,
    isRead: d.is_read,
    createdAt: date(d.created_on),
  };
}

const u = (userId: string) => `/api/users/${encodeURIComponent(userId)}`;

// ---- Profile ----
export const getProfile = async (userId: string) =>
  toUser(await apiFetch<ProfileDto>("GET", `${u(userId)}/profile`));

export const updateProfile = async (
  userId: string,
  data: { username?: string; firstName?: string; lastName?: string; languagePreference?: string },
) =>
  toUser(
    await apiFetch<ProfileDto>("PUT", `${u(userId)}/profile`, {
      ...(data.username !== undefined && { username: data.username }),
      ...(data.firstName !== undefined && { first_name: data.firstName }),
      ...(data.lastName !== undefined && { last_name: data.lastName }),
      ...(data.languagePreference !== undefined && { language_preference: data.languagePreference }),
    }),
  );

export const completeEmailVerification = async (userId: string, language: string) =>
  toUser(await apiFetch<ProfileDto>("POST", `${u(userId)}/verify-email-complete?language=${language}`));

// ---- Transcriptions ----
export async function listTranscriptions(userId: string, page = 1, pageSize = 50) {
  const res = await apiFetch<Page<TranscriptionDto>>(
    "GET",
    `${u(userId)}/transcriptions?page=${page}&page_size=${pageSize}`,
  );
  return { transcriptions: res.data.map(toTranscription), total: res.pagination.total_elements };
}

export const getTranscription = async (userId: string, id: string) =>
  toTranscription(await apiFetch<TranscriptionDto>("GET", `${u(userId)}/transcriptions/${id}`));

export const createTranscription = async (userId: string, videoUrl: string) =>
  toTranscription(await apiFetch<TranscriptionDto>("POST", `${u(userId)}/transcriptions`, { video_url: videoUrl }));

// ---- File uploads: reserve a job, POST the file straight to S3, then start the job ----
interface UploadDto {
  transcription: TranscriptionDto;
  upload: { url: string; fields: Record<string, string>; expires_in: number; max_bytes: number };
}

export interface UploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export async function createUpload(userId: string, req: UploadRequest) {
  const d = await apiFetch<UploadDto>("POST", `${u(userId)}/transcriptions/uploads`, {
    filename: req.filename,
    content_type: req.contentType,
    size_bytes: req.sizeBytes,
    ...(req.durationSeconds !== undefined && { duration_seconds: req.durationSeconds }),
  });
  return { transcription: toTranscription(d.transcription), upload: d.upload };
}

/** POST the file to the presigned S3 form, reporting progress as a 0-1 fraction. */
export function uploadToStorage(
  target: { url: string; fields: Record<string, string> },
  file: File,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    Object.entries(target.fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", file); // S3 requires the file to be the last field
    const xhr = new XMLHttpRequest();
    xhr.open("POST", target.url);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new ApiError(xhr.status, "UPLOAD_FAILED")));
    xhr.onerror = () => reject(new ApiError(0, "UPLOAD_FAILED"));
    xhr.onabort = () => reject(new ApiError(0, "UPLOAD_CANCELLED"));
    signal?.addEventListener("abort", () => xhr.abort());
    xhr.send(form);
  });
}

export const startUpload = async (userId: string, id: string) =>
  toTranscription(await apiFetch<TranscriptionDto>("POST", `${u(userId)}/transcriptions/${id}/start`));

export const renameTranscription = async (userId: string, id: string, videoTitle: string) =>
  toTranscription(
    await apiFetch<TranscriptionDto>("PATCH", `${u(userId)}/transcriptions/${id}`, { video_title: videoTitle }),
  );

export const deleteTranscription = (userId: string, id: string) =>
  apiFetch<void>("DELETE", `${u(userId)}/transcriptions/${id}`);

// ---- Notifications ----
export async function listNotifications(userId: string, pageSize = 5) {
  const [page, count] = await Promise.all([
    apiFetch<Page<NotificationDto>>("GET", `${u(userId)}/notifications?page=1&page_size=${pageSize}`),
    apiFetch<{ unread_count: number }>("GET", `${u(userId)}/notifications/unread-count`),
  ]);
  return { notifications: page.data.map(toNotification), unreadCount: count.unread_count };
}

export const markNotificationRead = (userId: string, id: string) =>
  apiFetch<NotificationDto>("PATCH", `${u(userId)}/notifications/${id}`, { is_read: true });

export const markAllNotificationsRead = (userId: string) =>
  apiFetch<{ updated: number }>("PATCH", `${u(userId)}/notifications/mark-all-read`);

// ---- Plan usage ----
export type DownloadFormat = "txt" | "srt" | "vtt";

export interface Usage {
  plan: "free" | "pro" | string;
  dailyLimit: number | null; // null = unlimited
  usedToday: number;
  remainingToday: number | null; // null = unlimited
  resetsAt: string;
  maxVideoSeconds: number;
  maxUploadBytes: number;
  downloadFormats: DownloadFormat[];
  priorityProcessing: boolean;
  emailSupport: boolean;
}

interface UsageDto {
  plan: string;
  daily_limit: number | null;
  used_today: number;
  remaining_today: number | null;
  resets_at: string;
  max_video_seconds: number;
  max_upload_bytes?: number;
  download_formats: DownloadFormat[];
  priority_processing: boolean;
  email_support: boolean;
}

export async function getUsage(userId: string): Promise<Usage> {
  const d = await apiFetch<UsageDto>("GET", `${u(userId)}/usage`);
  return {
    plan: d.plan,
    dailyLimit: d.daily_limit,
    usedToday: d.used_today,
    remainingToday: d.remaining_today,
    resetsAt: d.resets_at,
    maxVideoSeconds: d.max_video_seconds,
    maxUploadBytes: d.max_upload_bytes ?? 500 * 1024 * 1024,
    downloadFormats: d.download_formats,
    priorityProcessing: d.priority_processing,
    emailSupport: d.email_support,
  };
}

/** Download a transcription in the given format (the API enforces plan access) and save it. */
export async function downloadTranscription(userId: string, id: string, format: DownloadFormat): Promise<void> {
  const res = await authorizedFetch("GET", `${u(userId)}/transcriptions/${id}/download?format=${format}`);
  if (!res.ok) throw await toApiError(res);
  const disposition = res.headers.get("Content-Disposition") || "";
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || `transcription-${id}.${format}`;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- Query keys (shared so invalidations match) ----
export const queryKeys = {
  usage: (userId?: string) => ["usage", userId] as const,
  profile: ["profile"] as const,
  transcriptions: (userId?: string) => ["transcriptions", userId] as const,
  transcription: (userId?: string, id?: string) => ["transcriptions", userId, id] as const,
  notifications: (userId?: string) => ["notifications", userId] as const,
};
