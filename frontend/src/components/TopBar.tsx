import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Icon } from "./Icon";

/** Desktop-only header above the main content — search (only where it's
 * real), notifications, date, and real user identity. Consistent across
 * screens rather than the reference mockups' own inconsistency (date on one
 * screen, user on another). */
export function TopBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  alertsPath,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  alertsPath: string;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchable = onSearchChange !== undefined;
  const today = new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="hidden md:flex items-center gap-4 mb-stack-lg">
      {searchable && (
        <div className="flex-1 relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" size={20} />
          <input
            type="text"
            value={searchValue ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-touch-target rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          />
        </div>
      )}
      <button
        onClick={() => navigate(alertsPath)}
        aria-label={t("navExtra.alerts")}
        className={`relative h-touch-target w-touch-target flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors flex-shrink-0 ${
          searchable ? "" : "ml-auto"
        }`}
      >
        <Icon name="notifications" size={22} />
      </button>
      <div className="h-6 w-px bg-outline-variant flex-shrink-0" />
      <div className="flex items-center gap-2 flex-shrink-0">
        <Icon name="calendar_month" size={18} className="text-slate-muted" />
        <span className="font-label-sm text-label-sm text-slate-muted whitespace-nowrap">{today}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-xs">
          {(user?.full_name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div className="leading-tight">
          <p className="font-label-sm text-label-sm text-on-surface font-bold">{user?.full_name}</p>
          <p className="text-[11px] text-slate-muted uppercase">
            {user?.role === "field_officer" ? t("auth.fieldOfficer") : t("common.enterpriseOwner")}
          </p>
        </div>
      </div>
    </div>
  );
}
