import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiFetch } from "./api";

/**
 * Generic authenticated request (Cognito ID token via Amplify).
 * Prefer the typed functions in ./api; this remains for pages not yet migrated.
 * Throws ApiError on non-2xx; resolves to the parsed JSON body.
 */
export async function apiRequest<T = any>(method: string, url: string, data?: unknown): Promise<T> {
  return apiFetch<T>(method, url, data);
}

const defaultQueryFn: QueryFunction = ({ queryKey }) => apiFetch("GET", queryKey.join("/"));

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: defaultQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
