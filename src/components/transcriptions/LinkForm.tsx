import { useEffect, useState } from "react";
import { ActivityBar, Alert, AlertDescription, Button, Input, Label, Progress, useLanguage } from "@pacific-code-labs/ujto-ds";
import { Laptop } from "lucide-react";
import { Link } from "wouter";
import type { Transcription } from "@/lib/api-types";
import { onDesktopProgress, useDesktopBridge, useDesktopDownloads } from "@/services/desktop.service";
import { transcribeLink, transcribeLinkOnDevice } from "@/services/transcription.service";

interface Props {
  userId: string;
  maxVideoSeconds: number;
  initialUrl?: string;
  disabled?: boolean;
  onQueued: (transcription: Transcription) => void;
  onError: (message: string) => void;
}

type Phase = "probing" | "preparing" | "uploading" | "starting" | "queueing";

/** Desktop flow as one bar: reading the link 3 %, download 5–55 %, upload 55–95 %, starting 97 %. */
function linkPercent(phase: Phase, progress: { phase: string; fraction: number } | null): number | null {
  if (phase === "queueing") return null; // server-side link: no measurable progress
  if (phase === "probing" || phase === "preparing") return 3;
  if (phase === "starting") return 97;
  const fraction = Math.min(1, Math.max(0, progress?.fraction ?? 0));
  return progress?.phase === "uploading" ? Math.round(55 + fraction * 40) : Math.round(5 + fraction * 50);
}

/**
 * Paste a link. In the desktop app the media is downloaded on the user's computer (their own
 * connection, which YouTube accepts); in the browser the server tries, best effort.
 */
export function LinkForm({ userId, maxVideoSeconds, initialUrl = "", disabled, onQueued, onError }: Props) {
  const { t } = useLanguage();
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [progress, setProgress] = useState<{ phase: string; fraction: number } | null>(null);
  const onDevice = useDesktopDownloads();
  const inDesktopApp = useDesktopBridge() !== null;
  useEffect(() => (onDevice ? onDesktopProgress((_job, p, fraction) => setProgress({ phase: p, fraction })) : undefined), [onDevice]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = url.trim();
    if (!/^https?:\/\/\S+$/i.test(value)) return onError(t("messages.invalidUrl"));
    try {
      setPhase(onDevice ? "probing" : "queueing");
      const job = onDevice
        ? await transcribeLinkOnDevice(userId, value, { maxVideoSeconds, onPhase: setPhase })
        : await transcribeLink(userId, value);
      setUrl("");
      onQueued(job);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      onError(code === "TOO_LONG" ? t("messages.videoTooLong") : code || t("messages.unknownError"));
    } finally {
      setPhase(null);
      setProgress(null);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {onDevice ? (
        <Alert>
          <Laptop className="h-4 w-4" />
          <AlertDescription>{t("app.new.onDevice")}</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <Laptop className="h-4 w-4" />
          <AlertDescription>
            {t("upload.linkDescription")}{" "}
            {!inDesktopApp && (
              <Link href="/desktop" className="font-medium text-primary underline-offset-4 hover:underline">
                {t("app.new.getDesktop")}
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="videoUrl">{t("transcription.videoUrl")}</Label>
        <Input
          id="videoUrl"
          type="url"
          inputMode="url"
          placeholder={t("transcription.videoUrlPlaceholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled || phase !== null}
        />
      </div>
      {phase && (
        // One bar for the whole flow instead of a spinner; indeterminate while the server queues a link.
        <div className="space-y-1" aria-live="polite">
          {linkPercent(phase, progress) === null ? (
            <ActivityBar label={t(`app.new.phase.${phase}`)} />
          ) : (
            <Progress value={linkPercent(phase, progress)!} className="h-2" aria-label={t(`app.new.phase.${phase}`)} />
          )}
          <p className="text-xs text-muted-foreground">
            {phase === "uploading" && progress
              ? t(progress.phase === "uploading" ? "upload.uploading" : "app.new.downloading", { percent: Math.round(progress.fraction * 100) })
              : t(`app.new.phase.${phase}`)}
          </p>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={!url.trim() || disabled || phase !== null}>
          {phase ? t(`app.new.phase.${phase}`) : t("app.new.transcribeLink")}
        </Button>
      </div>
    </form>
  );
}
