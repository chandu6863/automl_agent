import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import DatasetsPage from "./pages/DatasetsPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import SettingsPage from "./pages/SettingsPage";
import DatasetDetailPage from "./pages/DatasetDetailPage";
import AgentPage from "./pages/AgentPage";
import ModelsPage from "./pages/ModelsPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import BlockchainPage from "./pages/BlockchainPage";
import AppShell from "./layouts/AppShell";

function isAuthenticated() {
  return Boolean(localStorage.getItem("access_token"));
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/datasets" element={<DatasetsPage />} />
        <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/blockchain" element={<BlockchainPage />} />
        <Route path="/analytics" element={<PlaceholderPage title="Analytics" phase="Phase 11" />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
