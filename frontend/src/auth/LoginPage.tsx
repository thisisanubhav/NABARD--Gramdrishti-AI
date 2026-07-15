import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLogin } from "../api/hooks";
import { useAuth } from "./AuthContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">{t("auth.title")}</h1>
          <LanguageSwitcher />
        </div>
        <p className="text-sm text-slate-500 mt-1 mb-6">{t("auth.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth.email")}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="you@nabard.demo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t("auth.password")}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-lg bg-emerald-600 text-white py-2 text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {login.isPending ? t("auth.signingIn") : t("auth.signIn")}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400 mb-2">{t("auth.demoAccountsLabel")}</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fillDemo("officer@nabard.demo")}
              className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              {t("auth.fieldOfficer")}
            </button>
            <button
              onClick={() => fillDemo("owner1@nabard.demo")}
              className="text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700"
            >
              {t("auth.ownerAtRisk")}
            </button>
            <button
              onClick={() => fillDemo("owner2@nabard.demo")}
              className="text-xs px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
            >
              {t("auth.ownerStable")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
