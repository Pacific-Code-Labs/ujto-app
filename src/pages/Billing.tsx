import { Badge, Button, Card, CardContent, CardHeader, CardTitle, PageHeader, cn, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { Check } from "lucide-react";
import { useUsage } from "@/hooks/useUsage";
import { getPlans } from "@/repositories/content.repository";

/** Plans come from content/plans.json; the current plan and limits come from the API. */
export default function Billing() {
  const { t } = useLanguage();
  const L = useLocalized();
  const { usage } = useUsage();
  const current = usage?.plan ?? "free";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("app.billing.title")} description={t("app.billing.description")} />
      <div className="grid gap-6 md:grid-cols-2">
        {getPlans().map((plan) => {
          const isCurrent = plan.code === current;
          const soon = plan.status === "coming-soon";
          return (
            <Card key={plan.code} className={cn("flex flex-col", isCurrent && "border-2 border-primary")}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{L(plan.name)}</CardTitle>
                  {isCurrent && <Badge>{t("app.billing.current")}</Badge>}
                  {soon && !isCurrent && <Badge variant="secondary">{t("common.comingSoon")}</Badge>}
                </div>
                <p>
                  <span className="text-4xl font-bold">{plan.price}</span>{" "}
                  <span className="text-muted-foreground">{L(plan.period)}</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="mb-6 flex-1 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{L(feature)}</span>
                    </li>
                  ))}
                </ul>
                <Button disabled className="w-full" variant={isCurrent ? "outline" : "default"}>
                  {isCurrent ? t("app.billing.current") : soon ? t("common.comingSoon") : t("common.upgrade")}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">{t("app.billing.paymentsSoon")}</p>
    </div>
  );
}
