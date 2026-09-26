import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supportRepository } from "@/repositories/support.repository";

export const supportKeys = {
  list: (userId?: string) => ["support", userId] as const,
  ticket: (userId?: string, id?: string) => ["support", userId, id] as const,
};

// Replies arrive as realtime hints (/support/{sub}); the 60 s refetch only covers a dropped socket.
export function useSupportTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: supportKeys.list(user?.id),
    queryFn: () => supportRepository.list(user!.id),
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });
}

export function useSupportTicket(id: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: supportKeys.ticket(user?.id, id),
    queryFn: () => supportRepository.get(user!.id, id),
    enabled: !!user?.id && !!id,
    refetchInterval: 60_000,
  });
}
