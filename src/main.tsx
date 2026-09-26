import { createRoot } from "react-dom/client";
import "./lib/amplify";
import App from "./App";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { initContent, refreshContent } from "@/repositories/content.repository";
import { initBrand } from "@/services/content.service";
import "./index.css";

// Render at once (last published copy seen, else the bundle), then refresh in the background
// and re-render only when the published content changed.
initContent();
initBrand();
const root = createRoot(document.getElementById("root")!);
const render = (key?: string) =>
  root.render(
    <ErrorBoundary>
      <App key={key} />
    </ErrorBoundary>,
  );
render();
void refreshContent().then((changed) => {
  if (!changed) return;
  initBrand();
  render("published");
});
