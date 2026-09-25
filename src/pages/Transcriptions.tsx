import { useState } from "react";
import { Button, Card, CardContent, Input, PageHeader, useLanguage } from "@pacific-code-labs/ujto-ds";
import { PlusCircle, RefreshCw, Search } from "lucide-react";
import { Link } from "wouter";
import { TranscriptionRow } from "@/components/transcriptions/TranscriptionRow";
import { useTranscriptions } from "@/hooks/useTranscriptions";

export default function Transcriptions() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const { transcriptions, total, isLoading, isFetching, refetch } = useTranscriptions(100);
  const q = query.trim().toLowerCase();
  const shown = q
    ? transcriptions.filter((item) =>
        [item.videoTitle, item.originalFilename, item.videoUrl, item.transcript].some((v) => v?.toLowerCase().includes(q)),
      )
    : transcriptions;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t("history.title")}
        description={t("app.history.count", { count: total })}
        actions={
          <>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
            <Button asChild>
              <Link href="/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("app.nav.new")}
              </Link>
            </Button>
          </>
        }
      />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={t("app.history.search")} value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {q ? t("app.history.noMatches") : t("history.empty.title")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {shown.map((item) => (
            <TranscriptionRow key={item.id} transcription={item} />
          ))}
        </div>
      )}
    </div>
  );
}
