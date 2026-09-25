// Cross-site links. The landing lives on its own domain (ujto.jcampos.dev); the URL comes
// from SSM /ujto/<env>/web/site/landing-url (VITE_LANDING_URL), with the prod domain as default.
export const LANDING_URL = ((import.meta.env.VITE_LANDING_URL as string | undefined) || "https://ujto.jcampos.dev").replace(
  /\/$/,
  "",
);

export const landingHref = (lang: string, hash = "") => `${LANDING_URL}/${lang}${hash ? `#${hash}` : ""}`;

export function goToLanding(lang: string) {
  window.location.assign(landingHref(lang));
}
