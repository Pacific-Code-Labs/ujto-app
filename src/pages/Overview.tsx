import { Button, Card, CardContent, CardHeader, CardTitle, PageHeader, parseRichText, resolveIcon, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { ArrowRight, Clock, Gauge, PlusCircle } from "lucide-react";
import { Link } from "wouter";
import { TranscriptionRow } from "@/components/transcriptions/TranscriptionRow";
import { useAuth } from "@/hooks/useAuth";
import { useTranscriptions } from "@/hooks/useTranscriptions";
import { useUsage } from "@/hooks/useUsage";
import { getOverview } from "@/repositories/content.repository";

export default function Overview() {
  const { t } = useLanguage();
  const L = useLocalized();
  const { user } = useAuth();
  const { usage, isUnlimited } = useUsage();
  const { transcriptions, isLoading } = useTranscriptions();
  const content = getOverview();
  const recent = transcriptions.slice(0, 5);
  const name = user?.firstName || user?.username || "";

  const stats = [
    {
      icon: Gauge,
      label: t("dashboard.minutesLeft"),
      value: usage
        ? isUnlimited
          ? "∞"
          : t("dashboard.minutesOf", { left: Math.floor((usage.remainingSecondsToday ?? 0) / 60), total: Math.round((usage.dailySeconds ?? 0) / 60) })
        : "—",
    },
    { icon: Clock, label: t("app.overview.maxLength"), value: usage ? t("app.minutes", { count: Math.floor(usage.maxVideoSeconds / 60) }) : "—" },
    { icon: ArrowRight, label: t("dashboard.plan"), value: usage ? t(`dashboard.${usage.plan === "pro" ? "pro" : "free"}`) : "—" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={L(content.welcome).replace("{{name}}", name)}
        description={L(content.subtitle)}
        actions={
          <Button asChild>
            <Link href="/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("app.nav.new")}
            </Link>
          </Button>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{t("app.overview.recent")}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/transcriptions">{t("app.overview.seeAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            ) : recent.length === 0 ? (
              <div className="py-8 text-center">
                <p className="font-medium">{L(content.empty.title)}</p>
                <p className="mb-4 text-sm text-muted-foreground">{L(content.empty.body)}</p>
                <Button asChild>
                  <Link href="/new">{t("upload.start")}</Link>
                </Button>
              </div>
            ) : (
              recent.map((item) => <TranscriptionRow key={item.id} transcription={item} />)
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {content.tips.map((tip) => {
            const Icon = resolveIcon(tip.iconName);
            return (
              <Card key={tip.iconName}>
                <CardContent className="flex gap-3 p-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <p className="font-medium">{L(tip.title)}</p>
                    <p className="text-sm text-muted-foreground">{parseRichText(L(tip.body))}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
