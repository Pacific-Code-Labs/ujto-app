import { Alert, AlertDescription, Card, CardContent, PageHeader, Progress, Tabs, TabsContent, TabsList, TabsTrigger, useLanguage, useToast } from "@pacific-code-labs/ujto-ds";
import { useQueryClient } from "@tanstack/react-query";
import { Link2, Upload } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { LinkForm } from "@/components/transcriptions/LinkForm";
import { UploadForm } from "@/components/transcriptions/UploadForm";
import { useAuth } from "@/hooks/useAuth";
import { useUsage } from "@/hooks/useUsage";
import { queryKeys } from "@/lib/api";
import type { Transcription } from "@/lib/api-types";

export default function NewTranscription() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { usage, isLimitReached } = useUsage();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  // The landing's hero form sends visitors here with ?url=…
  const sharedUrl = new URLSearchParams(useSearch()).get("url") ?? "";

  const queued = (job: Transcription) => {
    toast({ title: t("transcription.queued.title"), description: t("transcription.queued.description", { title: job.videoTitle || "" }) });
    queryClient.invalidateQueries({ queryKey: queryKeys.transcriptions(user?.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.usage(user?.id) });
    navigate(`/transcriptions/${job.id}`);
  };
  const failed = (message: string) =>
    toast({ title: t("transcription.error.title"), description: message, variant: "destructive" });

  if (!user) return null;
  const limits = { maxUploadBytes: usage?.maxUploadBytes ?? 500 * 1024 * 1024, maxVideoSeconds: usage?.maxVideoSeconds ?? 0 };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("transcription.newTranscription")} description={t("upload.description")} />
      {isLimitReached && (
        <Alert className="mb-4">
          <AlertDescription>{t("dashboard.dailyLimitReached", { minutes: Math.round((usage?.dailySeconds ?? 0) / 60) })}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue={sharedUrl ? "link" : "upload"}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                {t("upload.tab")}
              </TabsTrigger>
              <TabsTrigger value="link" className="gap-2">
                <Link2 className="h-4 w-4" />
                {t("upload.linkTab")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <UploadForm userId={user.id} {...limits} disabled={isLimitReached || !usage} onQueued={queued} onError={failed} />
            </TabsContent>
            <TabsContent value="link">
              <LinkForm
                userId={user.id}
                maxVideoSeconds={limits.maxVideoSeconds}
                initialUrl={sharedUrl}
                disabled={isLimitReached || !usage}
                onQueued={queued}
                onError={failed}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {usage && usage.dailySeconds !== null && (
        // Today's minute budget: running jobs already hold their minutes.
        <div className="mt-4 space-y-1">
          <Progress value={Math.min(100, (usage.usedSecondsToday / usage.dailySeconds) * 100)} className="h-2" />
          <p className="text-center text-sm text-muted-foreground">
            {t("dashboard.minutesLeftToday", {
              left: Math.floor((usage.remainingSecondsToday ?? 0) / 60),
              total: Math.round(usage.dailySeconds / 60),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
