import { activeTheme, applyBrandTheme, applyFavicon, resolveAssetUrl } from "@pacific-code-labs/ujto-ds";
import { getBranding, getThemes } from "@/repositories/content.repository";

/** Apply the active theme and favicon from content (called once from main.tsx). */
export function initBrand() {
  applyBrandTheme(activeTheme(getThemes()));
  applyFavicon(resolveAssetUrl(getBranding().faviconUrl));
}
