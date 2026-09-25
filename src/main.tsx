import { createRoot } from "react-dom/client";
import "./lib/amplify";
import App from "./App";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { initBrand } from "@/services/content.service";
import "./index.css";

initBrand();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
