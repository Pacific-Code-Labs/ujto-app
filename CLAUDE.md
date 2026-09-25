# ujto-app (fe/app)

Public repo: never add secrets, infra IDs or backend code. Config comes from SSM at build time.

- **Content ↔ admin:** every `src/content/*.json` is edited by ujto-admin (`fe/admin`), which needs a
  page + sidebar entry + route + versions row for it. Adding a content file = add it there too.
- **No hard-coded text:** chrome → `src/translations/{en,es}.json` via `t("…")`; per-entity copy →
  `src/content/*.json` as `{ "en", "es" }` values read with `useLocalized()`. Icons as `iconName`
  (`resolveIcon`), rich text through `parseRichText`. `pnpm check:i18n` must pass.
- **Layers:** content JSON is imported only in `repositories/content.repository.ts`; API calls go through
  `repositories/transcriptions.repository.ts` (`lib/api.ts`); logic lives in `services/`.
- **Design system:** import UI from `@pacific-code-labs/ujto-ds`; colours only via tokens.
  To change the DS, work in `fe/design-system`, tag a release, bump the dependency here.
- Routes are nested under `/:lang`; use relative paths (`navigate("/new")`), `~/` for absolute.
- Verify: `pnpm build` (i18n checks + tsc + vite build).
