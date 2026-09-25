// API configuration. VITE_* values come from SSM (/ujto/<env>/web) through the process env:
// the root reboot-server.sh locally, scripts/load-env-from-ssm.sh --github-env in CI.
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

if (!configuredApiBaseUrl && import.meta.env.PROD) {
  throw new Error("Missing VITE_API_BASE_URL. Load it from SSM with scripts/load-env-from-ssm.sh.");
}

// Local default: the FastAPI dev server (be/api-be).
export const API_BASE_URL = (configuredApiBaseUrl || "http://localhost:8000").replace(/\/$/, "");
