# ujto-app

The Ujtö̀ dashboard at **https://app.ujto.jcampos.dev**: sign in, upload a video or audio file
(or paste a link), follow the job and read, copy or download the transcript.

Part of the [ujto-root](https://github.com/Pacific-Code-Labs/ujto-root) workspace (`fe/app`).
The landing lives in [ujto](https://github.com/Pacific-Code-Labs/ujto) (`ujto.jcampos.dev`), the
shared UI in [ujto-design-system](https://github.com/Pacific-Code-Labs/ujto-design-system), and the
[desktop app](https://github.com/Pacific-Code-Labs/ujto-desktop) shows this same app in a native window.

## Stack

React 18 · Vite 6 · TypeScript · Tailwind v4 through `@pacific-code-labs/ujto-ds` · wouter ·
TanStack Query · Amplify v6 (Cognito). pnpm, Node 24.

## Structure (landing-DXP pattern)

```
src/
  content/*.json        editable copy (edited in ujto-admin): overview, errors, plans, help,
                        desktop, branding, themes, media
  translations/{en,es}.json   fixed UI chrome, t("…")
  repositories/         the ONLY importers of content JSON; API access (lib/api.ts)
  services/             logic: upload flow, error copy, desktop bridge, brand init
  hooks/ components/ pages/
```

- No user-visible literals in components: chrome through `t("…")`, copy from `src/content`
  (`pnpm check:i18n` enforces it and is part of `pnpm build`).
- Routes are language-prefixed (`/en/...`, `/es/...`).

## Upload flow

`POST /transcriptions/uploads` → presigned S3 POST (the browser sends the file straight to S3,
with progress) → `POST /transcriptions/{id}/start`. The worker deletes the file when the job ends.
Links are best-effort (YouTube blocks cloud IPs); inside the desktop app the link is downloaded on
the user's machine through the `window.pywebview.api` bridge (`services/desktop.service.ts`).

## Develop

From the workspace root: `./reboot-server.sh` (API :8000, this app :5174, config from SSM).
Alone: `eval "$(bash scripts/load-env-from-ssm.sh prod PACIFIC-PROD --print-exports)" && pnpm dev`.

## Deploy

Push to `main` → GitHub Actions assumes the read-only `AWS_WEB_BUILD_ROLE_ARN` role, loads
`/ujto/prod/web/*` from SSM, runs `pnpm build` and publishes `dist/` to GitHub Pages
(`public/CNAME` = `app.ujto.jcampos.dev`; `404.html` is a copy of `index.html` for deep links).
