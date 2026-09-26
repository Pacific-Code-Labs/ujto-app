// The ONLY place the app's content JSON is imported. Editors change these files through
// the ujto-admin CMS; components read them through services.
import branding from "@/content/branding.json";
import themes from "@/content/themes.json";
import media from "@/content/media.json";
import overview from "@/content/overview.json";
import errors from "@/content/errors.json";
import plans from "@/content/plans.json";
import help from "@/content/help.json";
import desktop from "@/content/desktop.json";
import support from "@/content/support.json";
import { cachedPublishedContent, loadPublishedContent, type BrandTheme, type MediaLibrary } from "@pacific-code-labs/ujto-ds";
import { PUBLIC_API } from "@/lib/config";

// Published documents (edited online in the admin console) override the bundled JSON:
// initContent() uses the last copy this browser saw (sync), refreshContent() fetches fresh ones
// in the background and reports whether they changed (the caller re-renders).
const BUNDLED: Record<string, unknown> = { branding, themes, media, overview, errors, plans, help, desktop, support };
let published: Record<string, unknown> = {};
const doc = <T>(key: string, bundled: T): T => (published[key] as T | undefined) ?? bundled;

export function initContent() {
  published = cachedPublishedContent("app") ?? {};
}

export async function refreshContent(): Promise<boolean> {
  const fresh = await loadPublishedContent(PUBLIC_API, "app");
  if (!fresh) return false;
  // Changed = differs from what is on screen (the previous published copy, else the bundle).
  const changed = Object.entries(fresh).some(([key, value]) => JSON.stringify(value) !== JSON.stringify(published[key] ?? BUNDLED[key]));
  published = fresh;
  return changed;
}

export type Branding = typeof branding;
export type Overview = typeof overview;
export type ErrorEntry = (typeof errors.items)[number];
export type PlanEntry = (typeof plans.items)[number];
export type Help = typeof help;
export type Desktop = typeof desktop;
export type DesktopPlatform = Desktop["platforms"][number];

export type Support = typeof support;

export const getBranding = (): Branding => doc("branding", branding);
export const getThemes = (): BrandTheme[] => doc("themes", themes as BrandTheme[]);
export const getMedia = (): MediaLibrary => doc("media", media as MediaLibrary);
export const getOverview = (): Overview => doc("overview", overview);
export const getErrors = () => doc("errors", errors);
export const getPlans = (): PlanEntry[] => doc("plans", plans).items;
export const getHelp = (): Help => doc("help", help);
export const getDesktop = (): Desktop => doc("desktop", desktop);
export const getSupport = (): Support => doc("support", support);
