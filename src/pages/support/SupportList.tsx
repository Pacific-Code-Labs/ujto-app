import { Badge, Button, Card, CardContent, ListSkeleton, PageHeader, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { LifeBuoy, Plus } from "lucide-react";
import { Link } from "wouter";
import { useSupportTickets } from "@/hooks/useSupport";
import { getSupport } from "@/repositories/content.repository";

export const STATUS_VARIANT = { open: "default", in_progress: "secondary", resolved: "outline", closed: "outline" } as const;

export default function SupportList() {
  const { t, language } = useLanguage();
  const L = useLocalized();
  const content = getSupport();
  const tickets = useSupportTickets();
  const category = (id: string) => L(content.categories.find((c) => c.id === id)?.label ?? content.categories[content.categories.length - 1].label);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={L(content.title)}
        description={L(content.intro)}
        actions={
          <Button asChild>
            <Link href="/support/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("app.support.new")}
            </Link>
          </Button>
        }
      />
      {tickets.isLoading ? (
        <ListSkeleton rows={3} label={t("common.loading")} />
      ) : tickets.error ? (
        <p className="text-destructive">{t("app.support.loadError")}</p>
      ) : !tickets.data?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-muted-foreground">
            <LifeBuoy className="h-8 w-8" />
            <p>{L(content.empty)}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {tickets.data.map((ticket) => (
            <Link key={ticket.id} href={`/support/${ticket.id}`} className="block rounded-lg border border-border bg-card p-4 hover:bg-muted/40">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{ticket.subject}</p>
                  <p className="text-sm text-muted-foreground">
                    {category(ticket.category)} · {ticket.updated_at ? new Date(ticket.updated_at).toLocaleString(language) : ""}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANT[ticket.status]}>{t(`app.support.status.${ticket.status}`)}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
