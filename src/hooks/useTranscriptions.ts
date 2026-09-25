import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, queryKeys } from "@/lib/api";
import { getTranscription, listTranscriptions } from "@/repositories/transcriptions.repository";
import { hasActiveJobs, isActive } from "@/services/transcription.service";

const noRetryOnAuth = (count: number, error: unknown) =>
  !(error instanceof ApiError && [401, 403, 404].includes(error.status)) && count < 3;

/** The user's transcriptions, newest first; polls every 5 s while any job is running. */
export function useTranscriptions(pageSize = 50) {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.transcriptions(user?.id),
    queryFn: () => listTranscriptions(user!.id, 1, pageSize),
    enabled: !!user?.id,
    staleTime: 0,
    retry: noRetryOnAuth,
    refetchInterval: (q) => (hasActiveJobs(q.state.data?.transcriptions) ? 5000 : false),
  });
  return { ...query, transcriptions: query.data?.transcriptions ?? [], total: query.data?.total ?? 0 };
}

/** One transcription; polls every 4 s until it completes or fails. */
export function useTranscription(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.transcription(user?.id, id),
    queryFn: () => getTranscription(user!.id, id!),
    enabled: !!user?.id && !!id,
    staleTime: 0,
    retry: noRetryOnAuth,
    refetchInterval: (q) => (q.state.data && isActive(q.state.data) ? 4000 : false),
  });
}
