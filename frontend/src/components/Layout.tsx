import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Icon } from "./Icon";

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export function Layout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isOfficer = user?.role === "field_officer";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const mobileNav: NavItem[] = isOfficer
    ? [
        { to: "/officer", label: t("navExtra.enterprisePortfolio"), icon: "storefront", end: true },
        { to: "/officer/alerts", label: t("navExtra.alerts"), icon: "warning" },
        { to: "/officer/profile", label: t("navExtra.profile"), icon: "person" },
      ]
    : [
        { to: "/portal", label: t("nav.dashboard"), icon: "home", end: true },
        { to: "/portal/ledger", label: t("navExtra.ledger"), icon: "account_balance_wallet" },
        { to: "/portal/alerts", label: t("navExtra.alerts"), icon: "warning" },
        { to: "/portal/profile", label: t("navExtra.profile"), icon: "person" },
      ];

  const desktopNav: NavItem[] = isOfficer
    ? [{ to: "/officer", label: t("navExtra.enterprisePortfolio"), icon: "storefront", end: true }]
    : [
        { to: "/portal", label: t("nav.dashboard"), icon: "dashboard", end: true },
        { to: "/portal/ledger", label: t("navExtra.transactions"), icon: "receipt_long" },
        { to: "/portal/risk-analysis", label: t("navExtra.riskAnalysis"), icon: "shield" },
      ];

  const navLinkClass = (isActive: boolean) =>
    `flex items-center gap-3 rounded-full px-4 py-3 transition-colors ${
      isActive ? "bg-primary-container text-on-primary-container font-bold" : "text-on-primary/80 hover:bg-on-primary/10"
    }`;

  return (
    <div className={`min-h-screen ${isOfficer ? "bg-background" : "bg-surface-cream"}`}>
      {/* Mobile top app bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 h-touch-target flex items-center justify-between px-margin-mobile bg-surface-bright border-b border-outline-variant">
        <h1 className="font-serif text-lg font-bold text-primary truncate px-2">{t("auth.title")}</h1>
        <LanguageSwitcher />
      </header>

      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-primary py-stack-lg z-40">
        <div className="px-6 mb-stack-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-lg flex-shrink-0">
            {(user?.full_name ?? "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-serif text-sm font-bold text-on-primary leading-tight truncate">{t("auth.title")}</p>
            <p className="text-xs text-on-primary/70 truncate">{user?.full_name}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 px-2">
          {desktopNav.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => navLinkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} filled={isActive} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto px-4 flex flex-col gap-3">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-on-primary/80 hover:text-on-primary text-sm px-2 py-2 transition-colors"
          >
            <Icon name="logout" />
            {t("common.signOut")}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="pt-[76px] pb-[88px] md:pt-stack-lg md:pb-stack-lg md:pl-64 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-center px-gutter-mobile py-2 bg-surface-container border-t border-outline-variant">
        {mobileNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className="flex-1 flex flex-col items-center justify-center min-w-0">
            {({ isActive }) => (
              <span
                className={`flex flex-col items-center justify-center px-1.5 py-1 rounded-full transition-all max-w-full ${
                  isActive ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant"
                }`}
              >
                <Icon name={item.icon} filled={isActive} />
                <span className="font-label-sm text-label-sm mt-1 truncate max-w-full">{item.label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
