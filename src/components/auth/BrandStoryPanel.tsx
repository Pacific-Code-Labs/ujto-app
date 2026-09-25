import { BookOpen } from "lucide-react";
import { useLanguage } from "@pacific-code-labs/ujto-ds";

const DICTIONARY_URL = "https://www.haakonkrohn.com/bribri/";

/**
 * Name-story panel shown beside the registration form (same pattern as Tsuru's).
 * Fixed brand colors in both themes (Río Talamanca + Mastate, 6.1:1) so the story reads the same in dark mode.
 * Tier 0 only: what the Bribri word means, credited, with its source; no cosmology
 * or sacred claims (see docs/BRAND_NAME_RESEARCH.md in the workspace root).
 */
export function BrandStoryPanel() {
  const { t } = useLanguage();

  return (
    <aside className="rounded-2xl p-8 lg:p-10 shadow-lg h-full flex flex-col justify-center bg-brand-river text-brand-sand">
      <div className="mb-5 w-11 h-11 rounded-xl bg-card/10 flex items-center justify-center">
        <BookOpen className="w-5 h-5" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold mb-4">{t("story.title")}</h2>
      <div className="flex flex-col gap-3 opacity-90 text-sm leading-relaxed">
        <p>{t("story.p1")}</p>
        <p>{t("story.p2")}</p>
        <p>{t("story.p3")}</p>
      </div>
      <p className="mt-6 text-xs opacity-80 border-t border-white/20 pt-4">
        {t("story.attribution")}{" "}
        <a href={DICTIONARY_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:opacity-100">
          {t("story.source")}
        </a>
        .
      </p>
    </aside>
  );
}
