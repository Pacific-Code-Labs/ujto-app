import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Button, cn, PageHeader, Textarea, useLanguage, useLocalized } from "@pacific-code-labs/ujto-ds";
import { ArrowLeft, Loader2, Paperclip } from "lucide-react";
import { Link, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supportKeys, useSupportTicket } from "@/hooks/useSupport";
import { getSupport } from "@/repositories/content.repository";
import { EVIDENCE_TYPES, MAX_EVIDENCE_BYTES, MAX_EVIDENCE_FILES, supportRepository } from "@/repositories/support.repository";
import { STATUS_VARIANT } from "./SupportList";

export default function SupportDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const L = useLocalized();
  const content = getSupport();
  const { user } = useAuth();
  const client = useQueryClient();
  const ticket = useSupportTicket(id);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: supportKeys.list(user?.id) });

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (ticket.isLoading) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (!ticket.data) return <p className="text-destructive">{t("app.support.loadError")}</p>;
  const tk = ticket.data;
  const closed = tk.status === "closed";
  const date = (value: string | null) => (value ? new Date(value).toLocaleString(language) : "");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/support" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {L(content.title)}
      </Link>
      <PageHeader title={tk.subject} description={date(tk.created_at)} actions={<Badge variant={STATUS_VARIANT[tk.status]}>{t(`app.support.status.${tk.status}`)}</Badge>} />
      <p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm">{tk.description}</p>
      {tk.incident_reference && (
        <p className="text-xs text-muted-foreground">
          {t("app.support.reference")}: <span className="font-mono">{tk.incident_reference}</span>
        </p>
      )}
      {!!tk.evidence?.length && (
        <div className="flex flex-wrap gap-2">
          {tk.evidence.map((e) => (
            <Button
              key={e.id}
              variant="outline"
              size="sm"
              onClick={async () => window.open((await supportRepository.evidenceUrl(user!.id, tk.id, e.id)).download_url, "_blank", "noopener,noreferrer")}
            >
              <Paperclip className="mr-1 h-4 w-4" /> {e.file_name}
            </Button>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {tk.messages?.map((m) => (
          <div key={m.id} className={cn("max-w-[85%] rounded-lg p-3 text-sm", m.is_staff ? "bg-primary/10" : "ml-auto bg-muted")}>
            <p className="whitespace-pre-wrap">{m.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.is_staff ? t("app.support.team") : t("app.support.you")} · {date(m.created_at)}
            </p>
          </div>
        ))}
      </div>
      {closed ? (
        <p className="rounded-md bg-muted p-3 text-sm">
          {L(content.closedNotice)}{" "}
          <Link href="/support/new" className="text-primary underline">
            {t("app.support.new")}
          </Link>
        </p>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await supportRepository.reply(user!.id, tk.id, reply.trim());
              setReply("");
            });
          }}
        >
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={t("app.support.replyPlaceholder")} maxLength={10000} rows={3} />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy || !reply.trim()}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("app.support.sendReply")}
            </Button>
            {(tk.evidence?.length ?? 0) < MAX_EVIDENCE_FILES && (
              <label className="cursor-pointer text-sm text-primary underline">
                {t("app.support.addScreenshot")}
                <input
                  type="file"
                  className="sr-only"
                  accept={EVIDENCE_TYPES.join(",")}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    if (!EVIDENCE_TYPES.includes(file.type) || file.size > MAX_EVIDENCE_BYTES) return setError(t("app.support.fileRules"));
                    void run(() => supportRepository.attach(user!.id, tk.id, file));
                  }}
                />
              </label>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
}
