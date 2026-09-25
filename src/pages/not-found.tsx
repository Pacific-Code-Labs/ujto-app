import { Button, Card, CardContent, useLanguage } from "@pacific-code-labs/ujto-ds";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center py-16">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-4 pt-6 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="text-2xl font-bold">{t("notFound.title")}</h1>
          <p className="text-muted-foreground">{t("notFound.description")}</p>
          <Button asChild>
            <Link href="/">{t("app.nav.overview")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
