import { getErrors, type ErrorEntry } from "@/repositories/content.repository";

/** Map a job's error (a code like YOUTUBE_ACCESS_BLOCKED or a worker message) to editable copy. */
export function resolveError(error: string | undefined | null): ErrorEntry {
  const { items, fallback } = getErrors();
  if (!error) return fallback;
  const lower = error.toLowerCase();
  return (
    items.find((e) => (e.match === "contains" ? lower.includes(e.code.toLowerCase()) : e.code === error)) ?? fallback
  );
}
