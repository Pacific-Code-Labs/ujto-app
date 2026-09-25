import { useLanguage } from "@pacific-code-labs/ujto-ds";
import { ChevronRight, Clock, FileText } from "lucide-react";
import { Link } from "wouter";
import type { Transcription } from "@/lib/api-types";
import { formatDuration } from "@/services/transcription.service";
import { SourceIcon } from "./SourceIcon";
import { StatusBadge } from "./StatusBadge";

/** One history row; the whole row opens the transcription. */
export function TranscriptionRow({ transcription }: { transcription: Transcription }) {
  const { t, language } = useLanguage();
  const title = transcription.videoTitle || transcription.originalFilename || transcription.videoUrl;
  const created = transcription.createdAt ? new Date(transcription.createdAt).toLocaleString(language) : "";
  return (
    <Link
      href={`/transcriptions/${transcription.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
    >
      <SourceIcon transcription={transcription} className="h-5 w-5" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{created}</span>
          {transcription.duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(transcription.duration)}
            </span>
          )}
          {transcription.status === "completed" && transcription.wordCount > 0 && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {t("app.words", { count: transcription.wordCount })}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={transcription.status} />
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
