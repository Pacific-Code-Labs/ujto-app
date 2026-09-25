import {
  LanguageToggle as DsLanguageToggle,
  ThemeToggle as DsThemeToggle,
  useLanguage,
} from "@pacific-code-labs/ujto-ds";

/** Theme and language toggles with this app's labels. */
export function ThemeToggle() {
  const { t } = useLanguage();
  return <DsThemeToggle label={t("theme.toggle")} />;
}

export function LanguageToggle() {
  const { t } = useLanguage();
  return <DsLanguageToggle label={t("language.switchTo")} />;
}
