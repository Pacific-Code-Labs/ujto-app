import { useState } from "react";
import { Alert, AlertDescription, Button, Input, Label, useLanguage } from "@pacific-code-labs/ujto-ds";
import { Laptop, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Transcription } from "@/lib/api-types";
import { desktopBridge } from "@/services/desktop.service";
import { transcribeLink, transcribeLinkOnDevice } from "@/services/transcription.service";

interface Props {
  userId: string;
  maxVideoSeconds: number;
  initialUrl?: string;
  disabled?: boolean;
  onQueued: (transcription: Transcription) => void;
  onError: (message: string) => void;
}

type Phase = "probing" | "uploading" | "starting" | "queueing";

/**
 * Paste a link. In the desktop app the media is downloaded on the user's computer (their own
 * connection, which YouTube accepts); in the browser the server tries, best effort.
 */
export function LinkForm({ userId, maxVideoSeconds, initialUrl = "", disabled, onQueued, onError }: Props) {
  const { t } = useLanguage();
  const [url, setUrl] = useState(initialUrl);
  const [phase, setPhase] = useState<Phase | null>(null);
  const onDevice = desktopBridge() !== null;

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
            <Link href="/desktop" className="font-medium text-primary underline-offset-4 hover:underline">
              {t("app.new.getDesktop")}
            </Link>
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
      <div className="flex justify-end">
        <Button type="submit" disabled={!url.trim() || disabled || phase !== null}>
          {phase ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t(`app.new.phase.${phase}`)}
            </>
          ) : (
            t("app.new.transcribeLink")
          )}
        </Button>
      </div>
    </form>
  );
}
