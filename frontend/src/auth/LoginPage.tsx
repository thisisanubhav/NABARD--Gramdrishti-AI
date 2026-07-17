import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLogin } from "../api/hooks";
import { useAuth } from "./AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Icon } from "../components/Icon";

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();
  const { login: setAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = await login.mutateAsync({ email, password });
      setAuth(data.access_token, data.user);
      navigate(data.user.role === "field_officer" ? "/officer" : "/portal");
    } catch {
      setError(t("auth.incorrectCredentials"));
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("demo1234");
  };

  const inputClass =
    "w-full h-touch-target rounded-lg border border-outline-variant px-3 font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary";

  const demoOptions = [
    { email: "officer@nabard.demo", icon: "badge", iconBg: "bg-surface-container", iconColor: "text-primary", title: t("auth.fieldOfficer"), subtitle: t("auth.fieldOfficerDesc") },
    { email: "owner1@nabard.demo", icon: "warning", iconBg: "bg-error-container", iconColor: "text-error", title: t("auth.ownerAtRisk"), subtitle: t("auth.ownerAtRiskDesc") },
    { email: "owner2@nabard.demo", icon: "check_circle", iconBg: "bg-success-green/15", iconColor: "text-success-green", title: t("auth.ownerStable"), subtitle: t("auth.ownerStableDesc") },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12 text-on-primary">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <Icon name="agriculture" size={30} />
            <span className="font-serif text-2xl font-bold">
              GramDrishti <span className="font-sans font-normal text-on-primary/70">AI</span>
            </span>
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight text-on-primary-container mb-6 max-w-md">
            {t("auth.heroHeadline")}
          </h1>
          <p className="text-on-primary/80 font-body-lg text-body-lg max-w-md">{t("auth.heroBody")}</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="font-label-caps text-label-caps text-on-primary/60">{t("auth.statEnterprises")}</p>
            <p className="font-serif text-3xl font-bold mt-1">60</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-primary/60">{t("auth.statSectors")}</p>
            <p className="font-serif text-3xl font-bold mt-1">5</p>
          </div>
          <div>
            <p className="font-label-caps text-label-caps text-on-primary/60">{t("auth.statForecast")}</p>
            <p className="font-serif text-3xl font-bold mt-1">6 Months</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12 relative">
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <Icon name="agriculture" size={24} className="text-primary" />
            <span className="font-serif text-xl font-bold text-primary">GramDrishti AI</span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-on-surface mb-1">{t("auth.welcomeBack")}</h1>
          <p className="font-body-md text-body-md text-slate-muted mb-8">{t("auth.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">{t("auth.email")}</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@nabard.demo"
              />
            </div>
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">{t("auth.password")}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            {error && <p className="font-label-sm text-label-sm text-error">{error}</p>}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full h-touch-target rounded-lg bg-primary text-on-primary font-label-sm text-label-sm font-bold hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {login.isPending ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-caps text-label-caps text-slate-muted whitespace-nowrap">
              {t("auth.quickAccessDemo")}
            </span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <div className="flex flex-col gap-2.5">
            {demoOptions.map((opt) => (
              <button
                key={opt.email}
                type="button"
                onClick={() => fillDemo(opt.email)}
                className="flex items-center gap-3 p-3 rounded-lg border border-outline-variant hover:border-primary hover:bg-surface-cream transition-colors text-left"
              >
                <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${opt.iconBg} ${opt.iconColor}`}>
                  <Icon name={opt.icon} size={18} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-label-sm text-label-sm text-on-surface font-bold">{opt.title}</span>
                  <span className="block text-xs text-slate-muted truncate">{opt.subtitle}</span>
                </span>
                <Icon name="chevron_right" size={18} className="text-slate-muted flex-shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-center font-label-sm text-label-sm text-slate-muted mt-8">
            {t("auth.footerRights")}
          </p>
        </div>
      </div>
    </div>
  );
}
