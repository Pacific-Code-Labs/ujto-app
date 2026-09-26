import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUsage, queryKeys } from "@/lib/api";

/** The signed-in user's plan and today's minute budget (from the API; resets 00:00 UTC).
 *  Running jobs hold their minutes until they finish; a failure gives them back. */
export function useUsage() {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.usage(user?.id),
    queryFn: () => getUsage(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 15_000,
    refetchInterval: 30_000, // a failed job returns its minutes; pick that up without a reload
  });
  const usage = query.data;
  return {
    ...query,
    usage,
    isUnlimited: usage?.dailySeconds === null,
    /** Minutes left today (Infinity when unlimited). */
    remainingMinutes: usage ? (usage.remainingSecondsToday === null ? Infinity : Math.floor(usage.remainingSecondsToday / 60)) : undefined,
    isLimitReached: usage ? usage.remainingSecondsToday !== null && usage.remainingSecondsToday < 1 : false,
  };
}
