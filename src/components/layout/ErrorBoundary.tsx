import { Component, type ErrorInfo, type ReactNode } from "react";
import { flattenTranslations, languageFromPath } from "@pacific-code-labs/ujto-ds";
import en from "@/translations/en.json";
import es from "@/translations/es.json";

// Outside every provider on purpose (it must render even if they crash), so it reads the
// translation files directly and picks the language from the URL.
const CATALOGS = { en: flattenTranslations(en), es: flattenTranslations(es) };

interface State {
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  public state: State = {};

  public static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  public render() {
    if (!this.state.error) return this.props.children;
    const lang = languageFromPath(window.location.pathname, ["en", "es"] as const) ?? "en";
    const tr = (key: string) => CATALOGS[lang][`errorBoundary.${key}`] ?? key;
    return (
      <div className="mx-auto mt-12 max-w-xl p-5 text-center">
        <h1 className="mb-2 text-2xl font-bold text-destructive">{tr("title")}</h1>
        <p className="text-muted-foreground">{tr("description")}</p>
        <details className="mt-5 text-left">
          <summary className="mb-2 cursor-pointer">{tr("details")}</summary>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </details>
        {/* A crash never reaches the API, so there is no server reference: the route and message
            go into the ticket subject instead. */}
        <a
          href={`/${lang}/support/new?${new URLSearchParams({ category: "general", from: window.location.pathname, subject: this.state.error.message.slice(0, 150) })}`}
          className="mr-3 mt-5 inline-block rounded-md border border-border px-5 py-2.5 hover:bg-muted"
        >
          {tr("report")}
        </a>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 rounded-md bg-primary px-5 py-2.5 text-primary-foreground hover:bg-primary/90"
        >
          {tr("reload")}
        </button>
      </div>
    );
  }
}
