import { Navigate, Route, Routes } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RequireRole } from "./auth/RequireRole";
import { Layout } from "./components/Layout";
import { PortalDashboard } from "./portal/PortalDashboard";
import { OfficerDashboard } from "./officer/OfficerDashboard";
import { EnterpriseDetail } from "./officer/EnterpriseDetail";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "field_officer" ? "/officer" : "/portal"} replace />;
}

export default function App() {
  const { t } = useTranslation();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/portal"
        element={
          <RequireRole role="enterprise_owner">
            <Layout nav={[{ to: "/portal", label: t("nav.dashboard"), end: true }]} />
          </RequireRole>
        }
      >
        <Route index element={<PortalDashboard />} />
      </Route>

      <Route
        path="/officer"
        element={
          <RequireRole role="field_officer">
            <Layout nav={[{ to: "/officer", label: t("nav.dashboard"), end: true }]} />
          </RequireRole>
        }
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="enterprise/:id" element={<EnterpriseDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
