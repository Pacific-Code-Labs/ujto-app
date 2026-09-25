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
import type { BrandTheme, MediaLibrary } from "@pacific-code-labs/ujto-ds";

export type Branding = typeof branding;
export type Overview = typeof overview;
export type ErrorEntry = (typeof errors.items)[number];
export type PlanEntry = (typeof plans.items)[number];
export type Help = typeof help;
export type Desktop = typeof desktop;
export type DesktopPlatform = Desktop["platforms"][number];

export const getBranding = (): Branding => branding;
export const getThemes = (): BrandTheme[] => themes as BrandTheme[];
export const getMedia = (): MediaLibrary => media as MediaLibrary;
export const getOverview = (): Overview => overview;
export const getErrors = () => errors;
export const getPlans = (): PlanEntry[] => plans.items;
export const getHelp = (): Help => help;
export const getDesktop = (): Desktop => desktop;
