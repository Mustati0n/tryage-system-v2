import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { AppShell } from "./components/AppShell";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminRecordsPage } from "./pages/admin/AdminRecordsPage";
import { AdminPersonnelPage } from "./pages/admin/AdminPersonnelPage";
import { AdminLogsPage } from "./pages/admin/AdminLogsPage";
import { PersonelDashboardPage } from "./pages/personel/PersonelDashboardPage";
import { PersonelPatientsPage } from "./pages/personel/PersonelPatientsPage";
import { PersonelTriagePage } from "./pages/personel/PersonelTriagePage";
import { PersonelRecordsPage } from "./pages/personel/PersonelRecordsPage";

function ProtectedRoute({
  children,
  role,
}: {
  children: JSX.Element;
  role: "ADMIN" | "PERSONEL";
}) {
  const auth = useAuth();
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (auth.role !== role) {
    return <Navigate to={auth.role === "ADMIN" ? "/admin" : "/personel"} replace />;
  }
  return children;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/personel/*"
        element={
          <ProtectedRoute role="PERSONEL">
            <AppShell role="PERSONEL">
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<PersonelDashboardPage />} />
                <Route path="patients" element={<PersonelPatientsPage />} />
                <Route path="triage" element={<PersonelTriagePage />} />
                <Route path="records" element={<PersonelRecordsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="ADMIN">
            <AppShell role="ADMIN">
              <Routes>
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="records" element={<AdminRecordsPage />} />
                <Route path="personnel" element={<AdminPersonnelPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
