import { Card, CardContent, PageHeader, parseRichText, resolveIcon, useLocalized } from "@pacific-code-labs/ujto-ds";
import { getHelp } from "@/repositories/content.repository";

export default function Help() {
  const L = useLocalized();
  const help = getHelp();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={L(help.title)} description={L(help.intro)} />
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {help.steps.map((step, i) => {
          const Icon = resolveIcon(step.iconName);
          return (
            <Card key={i}>
              <CardContent className="space-y-2 p-5">
                <Icon className="h-6 w-6 text-primary" />
                <p className="font-semibold">{L(step.title)}</p>
                <p className="text-sm text-muted-foreground">{parseRichText(L(step.body))}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="space-y-3">
        {help.faq.map((item, i) => (
          <details key={i} className="group rounded-lg border border-border bg-card p-4">
            <summary className="cursor-pointer list-none font-medium">{L(item.question)}</summary>
            <p className="mt-2 text-muted-foreground">{parseRichText(L(item.answer))}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
