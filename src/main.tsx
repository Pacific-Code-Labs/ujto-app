import { createRoot } from "react-dom/client";
import "./lib/amplify";
import App from "./App";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { initContent } from "@/repositories/content.repository";
import { initBrand } from "@/services/content.service";
import "./index.css";

// Published content first (bounded wait, bundled fallback), then brand and first render.
void initContent().finally(() => {
  initBrand();
  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>,
  );
});
