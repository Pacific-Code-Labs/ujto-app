import { Badge, Button, Card, CardContent, PageHeader, parseRichText, resolveIcon, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { CheckCircle2, Download } from "lucide-react";
import { getDesktop } from "@/repositories/content.repository";
import { downloadUrl, useDesktopBridge, usePlatformsInOrder } from "@/services/desktop.service";

export default function Desktop() {
  const { t } = useLanguage();
  const L = useLocalized();
  const content = getDesktop();
  const available = content.status === "available";
  const { platforms, primary } = usePlatformsInOrder();
  const running = useDesktopBridge() !== null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={L(content.title)} />
      <Card className="mb-6">
        <CardContent className="space-y-4 p-6">
          <p className="leading-relaxed">{parseRichText(L(content.description))}</p>
          {running && (
            <p className="flex items-center gap-2 font-medium text-success">
              <CheckCircle2 className="h-5 w-5" />
              {t("app.desktop.running")}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {platforms.map((p) => {
          const Icon = resolveIcon(p.iconName);
          const mine = p === primary;
          return (
            <Card key={p.file} className={mine ? "border-primary" : undefined}>
              <CardContent className="flex items-center gap-4 p-4">
                <Icon className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{L(p.label)}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.file}</p>
                </div>
                {mine && <Badge variant="secondary">{t("app.desktop.yourSystem")}</Badge>}
                {available ? (
                  <Button asChild size="sm" variant={mine ? "default" : "outline"}>
                    <a href={downloadUrl(p)}>
                      <Download className="mr-2 h-4 w-4" />
                      {t("download.button")}
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" disabled>
                    {t("common.comingSoon")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ul className="mt-6 space-y-1 text-sm text-muted-foreground">
        {content.requirements.map((r, i) => (
          <li key={i}>• {L(r)}</li>
        ))}
      </ul>
    </div>
  );
}
