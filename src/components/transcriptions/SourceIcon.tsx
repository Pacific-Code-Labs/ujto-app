import { FileAudio, Link2, Youtube } from "lucide-react";
import type { Transcription } from "@/lib/api-types";

/** Uploaded file, YouTube link or other link. */
export function SourceIcon({ transcription, className = "h-4 w-4" }: { transcription: Transcription; className?: string }) {
  if (transcription.sourceType === "upload") return <FileAudio className={`${className} shrink-0 text-primary`} />;
  if (/youtu\.?be/.test(transcription.videoUrl)) return <Youtube className={`${className} shrink-0 text-accent`} />;
  return <Link2 className={`${className} shrink-0 text-muted-foreground`} />;
}
