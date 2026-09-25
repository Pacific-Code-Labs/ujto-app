import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getUsage, queryKeys } from "@/lib/api";

/** The signed-in user's plan entitlements and today's usage (from the API; resets 00:00 UTC). */
export function useUsage() {
  const { user, isAuthenticated } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.usage(user?.id),
    queryFn: () => getUsage(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 15_000,
    refetchInterval: 30_000, // a failed job frees its slot; pick that up without a reload
  });
  const usage = query.data;
  return {
    ...query,
    usage,
    isUnlimited: usage?.dailyLimit === null,
    remaining: usage ? usage.remainingToday ?? Infinity : undefined,
    isLimitReached: usage ? usage.remainingToday !== null && usage.remainingToday <= 0 : false,
  };
}
