import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, Hospital, Pill, User, Siren, Sun, Moon, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/use-session";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/home", icon: Home, key: "nav.home" },
  { to: "/ai", icon: Sparkles, key: "nav.ai" },
  { to: "/hospitals", icon: Hospital, key: "nav.hospitals" },
  { to: "/medicines", icon: Pill, key: "nav.medicines" },
  { to: "/profile", icon: User, key: "nav.profile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
  }

  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="min-h-screen w-full bg-background transition-colors duration-200">
      {/* Floating Top Glassy Navigation Header */}
      <header className="fixed top-3 left-1/2 z-50 w-[94%] max-w-5xl -translate-x-1/2 rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 transition-all duration-300">
        <div className="flex h-14 items-center justify-between px-3.5 sm:px-6">
          <Link to="/home" className="flex items-center gap-2.5 transition-transform hover:opacity-90 active:scale-95">
            <span className="flex h-8.5 w-8.5 items-center justify-center rounded-xl bg-hero-gradient text-primary-foreground shadow-sm">
              <HeartPulse className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-base font-bold tracking-tight text-foreground">
              Medi guide <span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                    active
                      ? "bg-primary-soft text-primary shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.key)}
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions: Theme Toggle, SOS & Profile Avatar */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl text-foreground hover:bg-secondary"
              aria-label="Toggle theme mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </Button>

            <Link to="/sos" aria-label={t("common.emergency")} className="hidden sm:inline-flex">
              <span className="flex items-center gap-1.5 rounded-xl bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground shadow-sm transition-transform active:scale-95">
                <Siren className="h-3.5 w-3.5" />
                SOS
              </span>
            </Link>

            {/* Profile Icon / Avatar */}
            <Link
              to="/profile"
              aria-label="User Profile"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all border",
                pathname.startsWith("/profile")
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/30"
                  : "border-border/60 bg-secondary text-foreground hover:border-primary/40",
              )}
            >
              {userInitial ? (
                <span className="text-xs font-bold">{userInitial}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Responsive Content Container */}
      <div className="mx-auto w-full max-w-4xl px-0 pt-20 sm:px-4 md:px-6">
        <main className="flex-1 pb-28 md:pb-12">{children}</main>
      </div>

      {/* Mobile Floating SOS Pill */}
      <Link
        to="/sos"
        aria-label={t("common.emergency")}
        className="fixed bottom-22 right-4 z-30 md:hidden"
      >
        <span className="flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground shadow-lg backdrop-blur-md transition-transform active:scale-95">
          <Siren className="h-4 w-4 animate-pulse" />
          SOS
        </span>
      </Link>

      {/* Mobile Floating Glassy Bottom Navigation Bar */}
      <nav className="fixed bottom-3 left-1/2 z-40 w-[94%] max-w-md -translate-x-1/2 rounded-2xl border border-border/50 bg-card/85 p-1.5 shadow-xl backdrop-blur-xl md:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-11 items-center justify-center rounded-xl transition-all",
                      active && "bg-primary-soft text-primary shadow-xs font-bold",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {t(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pb-4 pt-4 md:px-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}


