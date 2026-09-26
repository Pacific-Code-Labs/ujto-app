import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import {
  AppShell,
  BrandLogo,
  BrandSymbol,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  resolveAssetUrl,
  useLanguage,
} from "@pacific-code-labs/ujto-ds";
import {
  CreditCard,
  ExternalLink,
  HelpCircle,
  History,
  LayoutDashboard,
  Laptop,
  LifeBuoy,
  LogOut,
  Menu,
  PlusCircle,
  User,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRequireEmailVerification } from "@/hooks/useEmailVerification";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import { landingHref } from "@/lib/links";
import { getBranding } from "@/repositories/content.repository";
import { NotificationDropdown } from "./NotificationDropdown";
import { LanguageToggle, ThemeToggle } from "./toggles";

export function FullPageSpinner() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" aria-label={t("common.loading")} />
    </div>
  );
}

/** Signed-in area: sends visitors to /login (keeping where they were going) and checks email verification. */
export function AppLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const { t, language } = useLanguage();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { checkAndRedirect } = useRequireEmailVerification();
  const branding = getBranding();
  useRealtimeEvents(isAuthenticated ? user?.id : undefined);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const next = location + window.location.search;
      navigate(`/login${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`, { replace: true });
    } else {
      void checkAndRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated]);

  if (isLoading || !isAuthenticated) return <FullPageSpinner />;

  const signOut = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <AppShell
      location={location}
      onNavigate={navigate}
      labels={{ collapse: t("app.shell.collapse"), expand: t("app.shell.expand"), close: t("app.shell.close") }}
      topItems={[{ href: "/", label: t("app.nav.overview"), icon: LayoutDashboard }]}
      groups={[
        {
          key: "transcriptions",
          label: t("app.nav.transcriptions"),
          icon: Sparkles,
          items: [
            { href: "/new", label: t("app.nav.new"), icon: PlusCircle },
            { href: "/transcriptions", label: t("app.nav.history"), icon: History },
          ],
        },
        {
          key: "account",
          label: t("app.nav.account"),
          icon: User,
          items: [
            { href: "/profile", label: t("app.nav.profile"), icon: User },
            { href: "/billing", label: t("app.nav.billing"), icon: CreditCard },
          ],
        },
        {
          key: "resources",
          label: t("app.nav.resources"),
          icon: HelpCircle,
          items: [
            { href: "/help", label: t("app.nav.help"), icon: HelpCircle },
            { href: "/support", label: t("app.nav.support"), icon: LifeBuoy },
            { href: "/desktop", label: t("app.nav.desktop"), icon: Laptop },
          ],
        },
      ]}
      brand={(collapsed) =>
        collapsed ? (
          <BrandSymbol className="h-7 w-7" alt={branding.companyName} />
        ) : (
          <BrandLogo
            className="h-7"
            src={resolveAssetUrl(branding.logoUrl) || undefined}
            srcDark={resolveAssetUrl(branding.logoUrlDark) || undefined}
            alt={branding.companyName}
          />
        )
      }
      footer={(collapsed) => (
        <a
          href={landingHref(language)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{t("app.nav.website")}</span>}
          {collapsed && <span className="sr-only">{t("app.nav.website")}</span>}
        </a>
      )}
      topbar={(openMenu) => (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-card px-4">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 lg:hidden" onClick={openMenu} aria-label={t("app.shell.menu")}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="lg:hidden">
            <BrandLogo className="h-6" alt={branding.companyName} />
          </div>
          <div className="flex-1" />
          <Button size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/new")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t("app.nav.new")}
          </Button>
          <NotificationDropdown />
          <ThemeToggle />
          <LanguageToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0" aria-label={t("app.shell.account")}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {(user?.firstName || user?.username || user?.email || "?").charAt(0).toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate font-normal">
                <p className="truncate text-sm font-medium">{user?.username}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" />
                {t("app.nav.profile")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/billing")}>
                <Wallet className="mr-2 h-4 w-4" />
                {t("app.nav.billing")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t("common.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
      )}
    >
      {children}
    </AppShell>
  );
}
