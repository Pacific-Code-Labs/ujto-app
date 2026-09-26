import { Badge, cn, useLanguage } from "@pacific-code-labs/ujto-ds";

const STYLES: Record<string, string> = {
  completed: "bg-success text-success-foreground hover:bg-success",
  processing: "bg-warning text-warning-foreground hover:bg-warning",
  pending: "bg-muted text-muted-foreground hover:bg-muted",
  awaiting_upload: "bg-muted text-muted-foreground hover:bg-muted",
  failed: "bg-destructive text-destructive-foreground hover:bg-destructive",
};

const LABEL_KEYS: Record<string, string> = {
  completed: "status.completed",
  processing: "status.processing",
  pending: "status.pending",
  awaiting_upload: "status.awaitingUpload",
  failed: "status.failed",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useLanguage();
  const running = status === "processing" || status === "pending" || status === "awaiting_upload";
  return (
    <Badge className={cn("gap-1 text-xs", STYLES[status] ?? STYLES.pending, className)}>
      {running && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
      {LABEL_KEYS[status] ? t(LABEL_KEYS[status]) : status}
    </Badge>
  );
}
