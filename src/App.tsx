import { QueryClientProvider } from "@tanstack/react-query";
import type { ComponentType } from "react";
import { Redirect, Route, Switch, useLocation, useParams } from "wouter";
import {
  LanguageProvider,
  ThemeProvider,
  Toaster,
  TooltipProvider,
  useLanguage,
  withLanguage,
} from "@pacific-code-labs/ujto-ds";
import { AppLayout } from "@/components/layout/AppLayout";
import { queryClient } from "@/lib/queryClient";
import en from "@/translations/en.json";
import es from "@/translations/es.json";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/verify-email";
import Billing from "@/pages/Billing";
import Desktop from "@/pages/Desktop";
import Help from "@/pages/Help";
import NewTranscription from "@/pages/NewTranscription";
import NotFound from "@/pages/not-found";
import Overview from "@/pages/Overview";
import Profile from "@/pages/profile";
import TranscriptionDetail from "@/pages/TranscriptionDetail";
import Transcriptions from "@/pages/Transcriptions";
import SupportDetail from "@/pages/support/SupportDetail";
import SupportList from "@/pages/support/SupportList";
import SupportNew from "@/pages/support/SupportNew";

export const LANGUAGES = ["en", "es"] as const;
const TRANSLATIONS = { en, es };

function setTitle(lang: string) {
  document.title = lang === "es" ? es.meta.title : en.meta.title;
}

/** Pages inside the signed-in shell. */
const inShell = (Page: ComponentType) => () => (
  <AppLayout>
    <Page />
  </AppLayout>
);

/** Routes under /<lang>; an unknown prefix is treated as a path without language. */
function LocalizedRoutes() {
  const { lang } = useParams<{ lang: string }>();
  const [location] = useLocation();
  const { language } = useLanguage();
  if (!(LANGUAGES as readonly string[]).includes(lang)) {
    return <Redirect to={`~${withLanguage(`/${lang}${location === "/" ? "" : location}`, language)}`} replace />;
  }
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/" component={inShell(Overview)} />
      <Route path="/new" component={inShell(NewTranscription)} />
      <Route path="/transcriptions" component={inShell(Transcriptions)} />
      <Route path="/transcriptions/:id" component={inShell(TranscriptionDetail)} />
      <Route path="/profile" component={inShell(Profile)} />
      <Route path="/billing" component={inShell(Billing)} />
      <Route path="/desktop" component={inShell(Desktop)} />
      <Route path="/help" component={inShell(Help)} />
      <Route path="/support" component={inShell(SupportList)} />
      <Route path="/support/new" component={inShell(SupportNew)} />
      <Route path="/support/:id" component={inShell(SupportDetail)} />
      {/* Old dashboard URL from the single-site days */}
      <Route path="/dashboard">
        <Redirect to="/" replace />
      </Route>
      <Route component={inShell(NotFound)} />
    </Switch>
  );
}

function RootRedirect() {
  const { language } = useLanguage();
  return <Redirect to={`/${language}${window.location.search}`} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider translations={TRANSLATIONS} languages={LANGUAGES} defaultLanguage="en" onChange={setTitle}>
          <TooltipProvider>
            <Switch>
              <Route path="/" component={RootRedirect} />
              <Route path="/:lang" nest component={LocalizedRoutes} />
            </Switch>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
