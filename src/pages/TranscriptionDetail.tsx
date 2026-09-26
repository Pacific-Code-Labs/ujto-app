import { ActivityBar, DetailSkeleton } from "@pacific-code-labs/ujto-ds";
import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Switch,
  Label,
  useLanguage,
  useToast,
} from "@pacific-code-labs/ujto-ds";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, Check, Clock, Copy, Pencil, Trash2, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { DownloadMenu } from "@/components/transcriptions/DownloadMenu";
import { ErrorNotice } from "@/components/transcriptions/ErrorNotice";
import { SourceIcon } from "@/components/transcriptions/SourceIcon";
import { StatusBadge } from "@/components/transcriptions/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { useTranscription } from "@/hooks/useTranscriptions";
import { queryKeys } from "@/lib/api";
import { deleteTranscription, renameTranscription } from "@/repositories/transcriptions.repository";
import { formatDuration, formatTimestamp, isActive } from "@/services/transcription.service";
import NotFound from "./not-found";

export default function TranscriptionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const { data: job, isLoading, error } = useTranscription(id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [timestamps, setTimestamps] = useState(true);
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl py-6">
        <DetailSkeleton label={t("common.loading")} />
      </div>
    );
  }
  if (error || !job || !user) return <NotFound />;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transcriptions(user.id) });
  };
  const saveTitle = async () => {
    if (!title.trim()) return setEditing(false);
    setBusy(true);
    try {
      const updated = await renameTranscription(user.id, job.id, title.trim());
      queryClient.setQueryData(queryKeys.transcription(user.id, job.id), updated);
      refresh();
      setEditing(false);
    } catch (e) {
      toast({ title: t("common.error"), description: (e as Error).message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!window.confirm(t("app.detail.confirmDelete"))) return;
    await deleteTranscription(user.id, job.id);
    refresh();
    toast({ title: t("app.detail.deleted") });
    navigate("/transcriptions");
  };
  const text = timestamps && job.segments.length
    ? job.segments.map((s) => `[${formatTimestamp(s.start)}] ${s.text}`).join("\n")
    : job.transcript;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t("messages.copied") });
    } catch {
      toast({ title: t("messages.copyFailed"), variant: "destructive" });
    }
  };
  const heading = job.videoTitle || job.originalFilename || job.videoUrl;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/transcriptions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("history.title")}
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex gap-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus aria-label={t("app.detail.rename")} />
              <Button size="sm" onClick={saveTitle} disabled={busy} aria-label={t("common.save")}>
                <Check className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)} aria-label={t("common.cancel")}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <SourceIcon transcription={job} className="mt-1.5 h-5 w-5" />
              <h1 className="break-words text-2xl font-bold">{heading}</h1>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 shrink-0 p-0"
                onClick={() => {
                  setTitle(job.videoTitle ?? "");
                  setEditing(true);
                }}
                aria-label={t("app.detail.rename")}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <StatusBadge status={job.status} />
            <span>{job.createdAt && new Date(job.createdAt).toLocaleString(language)}</span>
            {job.duration > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(job.duration)}
              </span>
            )}
            {job.status === "completed" && (
              <span className="flex items-center gap-1">
                <BarChart3 className="h-3.5 w-3.5" />
                {t("app.words", { count: job.wordCount })} · {t("app.detail.accuracy", { value: Math.round(job.accuracy) })}
              </span>
            )}
          </div>
          {job.sourceType === "url" && job.videoUrl && (
            <a href={job.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-sm text-primary hover:underline">
              {job.videoUrl}
            </a>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <DownloadMenu transcription={job} />
          <Button variant="outline" size="sm" onClick={remove} aria-label={t("common.delete")}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {job.status === "failed" && <ErrorNotice error={job.errorMessage} transcriptionId={job.id} />}

      {isActive(job) && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <div>
              <p className="font-medium">{t(job.status === "awaiting_upload" ? "status.awaitingUpload" : "history.processingDesc")}</p>
              <p className="text-sm text-muted-foreground">{t("app.detail.keepWorking")}</p>
            </div>
            {/* The worker reports no percentage: an activity bar, updated live when the job ends. */}
            <ActivityBar label={t("history.processingDesc")} />
          </CardContent>
        </Card>
      )}

      {job.status === "completed" && (
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <CardTitle>{t("app.detail.transcript")}</CardTitle>
            <div className="flex items-center gap-4">
              {job.segments.length > 0 && (
                <div className="flex items-center gap-2">
                  <Switch id="timestamps" checked={timestamps} onCheckedChange={setTimestamps} />
                  <Label htmlFor="timestamps" className="text-sm">
                    {t("app.detail.timestamps")}
                  </Label>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="mr-2 h-4 w-4" />
                {t("app.detail.copy")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {timestamps && job.segments.length > 0 ? (
              <ol className="space-y-2">
                {job.segments.map((s, i) => (
                  <li key={i} className="flex gap-3 leading-relaxed">
                    <span className="w-16 shrink-0 pt-0.5 font-mono text-xs text-muted-foreground">{formatTimestamp(s.start)}</span>
                    <span>{s.text}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{job.transcript}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
