import { useRef, useState } from "react";
import { Button, Progress, cn, useLanguage } from "@pacific-code-labs/ujto-ds";
import { FileAudio, Loader2, Upload } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { Transcription } from "@/lib/api-types";
import { mediaType, probeDuration, transcribeFile, type UploadPhase } from "@/services/transcription.service";

interface Props {
  userId: string;
  maxUploadBytes: number;
  maxVideoSeconds: number;
  disabled?: boolean;
  onQueued: (transcription: Transcription) => void;
  onError: (message: string) => void;
}

/** Pick or drop an audio/video file, upload it straight to storage and start the job. */
export function UploadForm({ userId, maxUploadBytes, maxVideoSeconds, disabled, onQueued, onError }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<UploadPhase | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const limits = { size: Math.floor(maxUploadBytes / (1024 * 1024)), minutes: Math.floor(maxVideoSeconds / 60) };
  const busy = phase !== null;

  const choose = (picked: File | undefined) => {
    if (!picked) return;
    if (!mediaType(picked)) return onError(t("upload.errors.notMedia"));
    if (picked.size > maxUploadBytes) return onError(t("upload.errors.tooBig", limits));
    setFile(picked);
  };

  const submit = async () => {
    if (!file) return;
    const duration = await probeDuration(file, mediaType(file)!);
    if (duration !== undefined && duration > maxVideoSeconds) return onError(t("upload.errors.tooLong", limits));
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress(0);
    setPhase("uploading");
    try {
      const job = await transcribeFile(userId, file, {
        durationSeconds: duration,
        onPhase: setPhase,
        onProgress: setProgress,
        signal: controller.signal,
      });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onQueued(job);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      onError(
        code === "UPLOAD_CANCELLED"
          ? t("upload.errors.cancelled")
          : code === "UPLOAD_FAILED" || !(error instanceof ApiError)
            ? t("upload.errors.failed")
            : code,
      );
    } finally {
      abortRef.current = null;
      setPhase(null);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!busy && !disabled) choose(e.dataTransfer.files[0]);
        }}
        className={cn(
          "w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors",
          "hover:border-primary hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-60",
          dragging ? "border-primary bg-muted/50" : "border-border",
        )}
      >
        {file ? (
          <span className="flex min-w-0 items-center justify-center gap-2 text-sm font-medium">
            <FileAudio className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate">{file.name}</span>
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2">
            <Upload className="h-9 w-9 text-primary" aria-hidden />
            <span className="font-medium">{t("upload.dropTitle")}</span>
            <span className="text-xs text-muted-foreground">{t("upload.dropHint", limits)}</span>
          </span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="audio/*,video/*" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />

      {phase === "uploading" && (
        <div className="space-y-1">
          <Progress value={Math.round(progress * 100)} />
          <p className="text-xs text-muted-foreground">{t("upload.uploading", { percent: Math.round(progress * 100) })}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {file && !busy && (
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            {t("upload.change")}
          </Button>
        )}
        {phase === "uploading" && (
          <Button type="button" variant="outline" onClick={() => abortRef.current?.abort()}>
            {t("upload.cancel")}
          </Button>
        )}
        <Button type="button" onClick={submit} disabled={!file || busy || disabled}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {phase === "starting" ? t("upload.starting") : t("transcription.processing")}
            </>
          ) : (
            t("upload.start")
          )}
        </Button>
      </div>
    </div>
  );
}
