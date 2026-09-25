import { Download, Lock } from "lucide-react";
import { Button } from "@pacific-code-labs/ujto-ds";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@pacific-code-labs/ujto-ds";
import { useLanguage } from "@pacific-code-labs/ujto-ds";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@pacific-code-labs/ujto-ds";
import { useUsage } from "@/hooks/useUsage";
import { downloadTranscription, type DownloadFormat } from "@/lib/api";
import type { Transcription } from "@/lib/api-types";

const FORMATS: DownloadFormat[] = ["txt", "srt", "vtt"];

/** Download a transcription as TXT (all plans) or SRT/VTT (Pro). The API enforces access too. */
export function DownloadMenu({ transcription }: { transcription: Transcription }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { usage } = useUsage();
  const ready = transcription.status === "completed" && !!transcription.transcript;
  const allowed = usage?.downloadFormats ?? ["txt"];

  const download = async (format: DownloadFormat) => {
    if (!user?.id) return;
    try {
      await downloadTranscription(user.id, transcription.id, format);
      toast({ title: t("messages.downloadTitle"), description: t("messages.downloadStarted") });
    } catch (error: any) {
      toast({ title: t("download.failed"), description: error?.message, variant: "destructive" });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={!ready}
          className="h-8 w-8 p-0"
          title={ready ? t("download.button") : t("download.notReady")}
          aria-label={ready ? t("download.button") : t("download.notReady")}
        >
          <Download className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[190px]">
        {FORMATS.map((format) => {
          const locked = !allowed.includes(format);
          return (
            <DropdownMenuItem
              key={format}
              disabled={locked}
              onClick={() => !locked && download(format)}
              title={locked ? t("download.proHint") : undefined}
              className="flex items-center justify-between gap-3"
            >
              <span>{t(`download.${format}`)}</span>
              {locked && (
                <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                  <Lock className="h-3 w-3" />
                  {t("download.proOnly")}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
