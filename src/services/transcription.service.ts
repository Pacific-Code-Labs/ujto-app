import type { Transcription } from "@/lib/api-types";
import {
  createTranscription,
  createUpload,
  deleteTranscription,
  startUpload,
  uploadToStorage,
} from "@/repositories/transcriptions.repository";
import { desktopBridge } from "@/services/desktop.service";

export const ACTIVE_STATUSES = ["awaiting_upload", "pending", "processing"];
export const isActive = (t: Transcription) => ACTIVE_STATUSES.includes(t.status);
export const hasActiveJobs = (list: Transcription[] | undefined) => !!list?.some(isActive);

// Browsers leave File.type empty for some containers; fall back to the extension.
const EXTENSION_TYPES: Record<string, string> = {
  mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", wav: "audio/wav", ogg: "audio/ogg",
  oga: "audio/ogg", opus: "audio/opus", flac: "audio/flac", weba: "audio/webm",
  mp4: "video/mp4", m4v: "video/mp4", mov: "video/quicktime", webm: "video/webm",
  mkv: "video/x-matroska", avi: "video/x-msvideo", mpeg: "video/mpeg", mpg: "video/mpeg",
};

export function mediaType(file: File): string | null {
  if (file.type.startsWith("audio/") || file.type.startsWith("video/")) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? null;
}

/** Read the duration from the file's metadata; undefined when the browser cannot tell. */
export function probeDuration(file: File, type: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const el = document.createElement(type.startsWith("video/") ? "video" : "audio");
    const url = URL.createObjectURL(file);
    const done = (value?: number) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(value !== undefined && Number.isFinite(value) ? value : undefined);
    };
    const timer = setTimeout(() => done(), 5000);
    el.preload = "metadata";
    el.onloadedmetadata = () => done(el.duration);
    el.onerror = () => done();
    el.src = url;
  });
}

export type UploadPhase = "uploading" | "starting";

/**
 * Upload a local file: reserve the job, POST the file straight to S3, start it.
 * A failed or cancelled upload drops the reserved job so it doesn't linger in the history.
 */
export async function transcribeFile(
  userId: string,
  file: File,
  opts: { durationSeconds?: number; onPhase?: (p: UploadPhase) => void; onProgress?: (f: number) => void; signal?: AbortSignal },
): Promise<Transcription> {
  const type = mediaType(file);
  if (!type) throw new Error("NOT_MEDIA");
  const { transcription, upload } = await createUpload(userId, {
    filename: file.name,
    contentType: type,
    sizeBytes: file.size,
    durationSeconds: opts.durationSeconds,
  });
  try {
    opts.onPhase?.("uploading");
    await uploadToStorage(upload, file, opts.onProgress, opts.signal);
    opts.onPhase?.("starting");
    return await startUpload(userId, transcription.id);
  } catch (error) {
    deleteTranscription(userId, transcription.id).catch(() => undefined);
    throw error;
  }
}

/** Queue a link on the server (best effort: YouTube often blocks our servers). */
export const transcribeLink = (userId: string, url: string) => createTranscription(userId, url.trim());

/**
 * Desktop app only: the link is downloaded on the user's machine (their own IP), the audio is
 * uploaded with a presigned POST the API issued for this user, then the job starts.
 */
export async function transcribeLinkOnDevice(
  userId: string,
  url: string,
  opts: { maxVideoSeconds: number; onPhase?: (p: "probing" | UploadPhase) => void },
): Promise<Transcription> {
  const bridge = desktopBridge();
  if (!bridge) throw new Error("NO_DESKTOP");
  opts.onPhase?.("probing");
  const info = await bridge.probe(url);
  if (!info.ok) throw new Error(info.error || "PROBE_FAILED");
  if (info.duration && info.duration > opts.maxVideoSeconds) throw new Error("TOO_LONG");
  const title = (info.title || "audio").slice(0, 200);
  const { transcription, upload } = await createUpload(userId, {
    filename: `${title}.m4a`,
    contentType: "audio/mp4",
    // The bridge re-checks the real size; the presigned POST enforces the plan limit.
    sizeBytes: 1,
    durationSeconds: info.duration,
  });
  try {
    opts.onPhase?.("uploading");
    const result = await bridge.download_and_upload(transcription.id, url, upload);
    if (!result.ok) throw new Error(result.error || "DOWNLOAD_FAILED");
    opts.onPhase?.("starting");
    return await startUpload(userId, transcription.id);
  } catch (error) {
    deleteTranscription(userId, transcription.id).catch(() => undefined);
    throw error;
  }
}

export function formatDuration(seconds: number): string {
  if (!seconds) return "0:00";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

export function formatTimestamp(seconds: number): string {
  return formatDuration(seconds);
}
