import { useEffect } from "react";
import { events } from "aws-amplify/api";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage, useToast } from "@pacific-code-labs/ujto-ds";
import { queryKeys } from "@/lib/api";
import { EVENTS_ENDPOINT } from "@/lib/config";
import { setRealtimeConnected } from "@/services/realtime.service";

interface Hint {
  eventType?: string;
  data?: { transcriptionId?: string; status?: string; ticketId?: string };
}

/**
 * One socket per signed-in user (AppSync Events, events.<domain>), subscribed to the user's own
 * channels: /transcriptions/{sub} (job status), /notifications/{sub} (bell) and /support/{sub}
 * (replies). Hints carry ids only: each one refetches the affected queries. AppSync doesn't
 * buffer, so every (re)connect refetches too; while disconnected the hooks poll slowly.
 */
export function useRealtimeEvents(userId?: string) {
  const client = useQueryClient();
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!userId || !EVENTS_ENDPOINT) return;
    let disposed = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let closers: (() => void)[] = [];

    const refetchAll = () => {
      void client.invalidateQueries({ queryKey: queryKeys.transcriptions(userId) });
      void client.invalidateQueries({ queryKey: queryKeys.usage(userId) });
      void client.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
      void client.invalidateQueries({ queryKey: ["support", userId] });
    };
    const onTranscription = (hint: Hint) => {
      // transcriptions(userId) is a prefix of every transcription(userId, id) key.
      void client.invalidateQueries({ queryKey: queryKeys.transcriptions(userId) });
      void client.invalidateQueries({ queryKey: queryKeys.usage(userId) });
      const status = hint.data?.status;
      if (status === "completed") toast({ title: t("notifications.transcriptionCompleted") });
      if (status === "failed") toast({ title: t("notifications.transcriptionFailed"), variant: "destructive" });
    };
    const handlers: Record<string, (hint: Hint) => void> = {
      [`/transcriptions/${userId}`]: onTranscription,
      [`/notifications/${userId}`]: () => void client.invalidateQueries({ queryKey: queryKeys.notifications(userId) }),
      [`/support/${userId}`]: () => void client.invalidateQueries({ queryKey: ["support", userId] }),
    };

    const disconnect = () => {
      closers.forEach((close) => close());
      closers = [];
      setRealtimeConnected(false);
    };
    const reconnect = () => {
      disconnect();
      if (!disposed) timer = setTimeout(connect, Math.min(30_000, 1000 * 2 ** attempts++));
    };
    const connect = async () => {
      try {
        for (const [path, handle] of Object.entries(handlers)) {
          const channel = await events.connect(path);
          if (disposed) return channel.close();
          const sub = channel.subscribe({ next: (message: unknown) => handle((message ?? {}) as Hint), error: reconnect });
          closers.push(() => {
            sub.unsubscribe();
            channel.close();
          });
        }
        attempts = 0;
        setRealtimeConnected(true);
        refetchAll();
      } catch {
        reconnect();
      }
    };
    void connect();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      disconnect();
    };
  }, [userId, client, toast, t]);
}
