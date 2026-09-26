import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Card, CardContent, Input, Label, PageHeader, Textarea, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { Loader2 } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supportKeys } from "@/hooks/useSupport";
import { getSupport } from "@/repositories/content.repository";
import { EVIDENCE_TYPES, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES, supportRepository } from "@/repositories/support.repository";

/** New request. `?reference=<request id>&category=…&subject=…` prefill it from an error. */
export default function SupportNew() {
  const { t, language } = useLanguage();
  const L = useLocalized();
  const content = getSupport();
  const { user } = useAuth();
  const client = useQueryClient();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(useSearch());
  const reference = params.get("reference") ?? "";
  const [category, setCategory] = useState(params.get("category") ?? content.categories[0].id);
  const [subject, setSubject] = useState(params.get("subject") ?? "");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const bad = picked.find((f) => !EVIDENCE_TYPES.includes(f.type) || f.size > MAX_EVIDENCE_BYTES);
    setError(bad ? t("app.support.fileRules") : null);
    setFiles([...files, ...picked.filter((f) => f !== bad)].slice(0, MAX_EVIDENCE_FILES));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const ticket = await supportRepository.create(user.id, {
        subject: subject.trim(),
        description: description.trim(),
        category,
        ...(reference && { incident_reference: reference }),
        context: {
          route: params.get("from") ?? document.referrer.replace(window.location.origin, "") ?? "",
          user_agent: navigator.userAgent,
          language,
          client: "web",
          app_version: import.meta.env.MODE,
        },
      });
      for (const file of files) await supportRepository.attach(user.id, ticket.id, file);
      await client.invalidateQueries({ queryKey: supportKeys.list(user.id) });
      navigate(`/support/${ticket.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t("app.support.new")} description={L(content.newIntro)} />
      <Card>
        <CardContent className="p-5">
          <form className="space-y-4" onSubmit={submit}>
            {reference && (
              <p className="rounded-md bg-muted p-3 text-sm">
                {L(content.referenceHint)} <span className="font-mono text-xs">{reference}</span>
              </p>
            )}
            <div className="space-y-1">
              <Label htmlFor="category">{t("app.support.category")}</Label>
              <select
                id="category"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {content.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {L(c.label)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subject">{t("app.support.subject")}</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={160} required minLength={3} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">{t("app.support.description")}</Label>
              <Textarea id="description" rows={6} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} required minLength={10} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="files">{t("app.support.screenshots")}</Label>
              <Input id="files" type="file" accept={EVIDENCE_TYPES.join(",")} multiple onChange={(e) => pickFiles(e.target.files)} />
              <p className="text-xs text-muted-foreground">{files.length ? files.map((f) => f.name).join(", ") : t("app.support.fileRules")}</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("app.support.send")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
