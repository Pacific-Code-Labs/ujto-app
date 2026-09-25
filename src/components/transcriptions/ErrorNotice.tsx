import { Alert, AlertDescription, AlertTitle, Button, parseRichText, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { resolveError } from "@/services/error.service";

const ACTIONS: Record<string, { href: string; labelKey: string }> = {
  desktop: { href: "/desktop", labelKey: "app.errors.useDesktop" },
  upgrade: { href: "/billing", labelKey: "app.errors.seePlans" },
  retry: { href: "/new", labelKey: "app.errors.tryAgain" },
};

/** Explains why a job failed (copy from content/errors.json) and offers the next step. */
export function ErrorNotice({ error }: { error?: string | null }) {
  const { t } = useLanguage();
  const L = useLocalized();
  const entry = resolveError(error);
  const action = ACTIONS[entry.action];
  return (
    <Alert variant="destructive" className="border-destructive/40">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{L(entry.title)}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{parseRichText(L(entry.message))}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/new">{t("app.errors.uploadFile")}</Link>
          </Button>
          {action && action.href !== "/new" && (
            <Button asChild size="sm" variant="outline">
              <Link href={action.href}>{t(action.labelKey)}</Link>
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
