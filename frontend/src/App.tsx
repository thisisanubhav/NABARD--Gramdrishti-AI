import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./auth/LoginPage";
import { RequireRole } from "./auth/RequireRole";
import { Layout } from "./components/Layout";
import { ProfilePage } from "./components/ProfilePage";
import { PortalDashboard } from "./portal/PortalDashboard";
import { LedgerPage } from "./portal/LedgerPage";
import { RiskAnalysisPage } from "./portal/RiskAnalysisPage";
import { AlertsPage } from "./portal/AlertsPage";
import { OfficerDashboard } from "./officer/OfficerDashboard";
import { EnterpriseDetail } from "./officer/EnterpriseDetail";
import { OfficerAlertsPage } from "./officer/OfficerAlertsPage";

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "field_officer" ? "/officer" : "/portal"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/portal"
        element={
          <RequireRole role="enterprise_owner">
            <Layout />
          </RequireRole>
        }
      >
        <Route index element={<PortalDashboard />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="risk-analysis" element={<RiskAnalysisPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route
        path="/officer"
        element={
          <RequireRole role="field_officer">
            <Layout />
          </RequireRole>
        }
      >
        <Route index element={<OfficerDashboard />} />
        <Route path="enterprise/:id" element={<EnterpriseDetail />} />
        <Route path="alerts" element={<OfficerAlertsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
