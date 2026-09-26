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
import { loadPublishedContent, type BrandTheme, type MediaLibrary } from "@pacific-code-labs/ujto-ds";
import { PUBLIC_API } from "@/lib/config";

// Published documents (edited online in the admin console) override the bundled JSON. Loaded
// once before the first render (initContent); on any failure the bundled copy is used.
let published: Record<string, unknown> = {};
const doc = <T>(key: string, bundled: T): T => (published[key] as T | undefined) ?? bundled;

export async function initContent() {
  published = (await loadPublishedContent(PUBLIC_API, "app")) ?? {};
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
