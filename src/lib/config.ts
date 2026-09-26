// API configuration. VITE_* values come from SSM (/ujto/<env>/web) through the process env:
// the root reboot-server.sh locally, scripts/load-env-from-ssm.sh --github-env in CI.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  throw new Error("Missing VITE_API_BASE_URL. Load it from SSM with scripts/load-env-from-ssm.sh.");
}

// Local default: the FastAPI dev server (be/api-be).
export const API_BASE_URL = (configuredApiBaseUrl || "http://localhost:8000").replace(/\/$/, "");

// Support API (support.<domain>, ujto-support-be): same Cognito token as the main API.
export const SUPPORT_API_URL = ((import.meta.env.VITE_SUPPORT_API_URL as string | undefined) || "http://localhost:8001").replace(/\/$/, "");

// Realtime hints (AppSync Events, events.<domain>): job status, notifications, support replies.
const eventsUrl = ((import.meta.env.VITE_APPSYNC_EVENTS_URL as string | undefined) || "").replace(/\/+$/, "");
export const EVENTS_ENDPOINT = eventsUrl ? (eventsUrl.endsWith("/event") ? eventsUrl : `${eventsUrl}/event`) : "";

// Public API (anonymous, identity pool guests): published content edited in the admin console.
const publicUrl = import.meta.env.VITE_PUBLIC_API_URL as string | undefined;
const identityPoolId = import.meta.env.VITE_PUBLIC_IDENTITY_POOL_ID as string | undefined;
export const PUBLIC_API = publicUrl && identityPoolId ? { url: publicUrl, identityPoolId } : null;
