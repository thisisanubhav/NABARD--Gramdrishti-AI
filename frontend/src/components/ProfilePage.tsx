import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/AuthContext";
import { useEnterprise } from "../api/hooks";
import { Icon } from "./Icon";

export function ProfilePage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: enterprise } = useEnterprise(user?.enterprise_id ?? undefined);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-stack-lg pt-stack-lg pb-8">
      <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-2xl">
        {(user?.full_name ?? "?").slice(0, 2).toUpperCase()}
      </div>

      <div className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md flex flex-col gap-stack-sm">
        <div>
          <p className="font-label-caps text-label-caps text-slate-muted uppercase">{t("common.fullName")}</p>
          <p className="font-body-md text-body-md text-on-surface font-bold">{user?.full_name}</p>
        </div>
        <div>
          <p className="font-label-caps text-label-caps text-slate-muted uppercase">{t("auth.email")}</p>
          <p className="font-body-md text-body-md text-on-surface">{user?.email}</p>
        </div>
        <div>
          <p className="font-label-caps text-label-caps text-slate-muted uppercase">{t("common.role")}</p>
          <p className="font-body-md text-body-md text-on-surface">
            {user?.role === "field_officer" ? t("auth.fieldOfficer") : t("common.enterpriseOwner")}
          </p>
        </div>
        {enterprise && (
          <div>
            <p className="font-label-caps text-label-caps text-slate-muted uppercase">{t("common.enterprise")}</p>
            <p className="font-body-md text-body-md text-on-surface">{enterprise.name}</p>
          </div>
        )}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-error border border-error/30 rounded-full px-4 py-2 text-sm font-medium hover:bg-error-container/30 transition-colors"
      >
        <Icon name="logout" size={18} />
        {t("common.signOut")}
      </button>
    </div>
  );
}
