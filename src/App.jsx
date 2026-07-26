import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage from "./pages/ChatPage";
import ReportsPage from "./pages/ReportsPage";
import ProfilePage from "./pages/ProfilePage";
import IdentityRiskPage from "./pages/IdentityRiskPage";
import HumanRiskPage from "./pages/HumanRiskPage";
import InsiderThreatPage from "./pages/InsiderThreatPage";
import AttackStoryPage from "./pages/AttackStoryPage";
import CyberLabPage from "./pages/CyberLabPage";
import SecurityDecisionPage from "./pages/SecurityDecisionPage";
import AttackSurfacePage from "./pages/AttackSurfacePage";
import FileAnalysisPage from "./pages/FileAnalysisPage";

// Admin (fully separate login/table, but reuses the same AI tool pages below)
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  // ---- Normal user auth ----
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  const handleLogin = (t) => {
    setToken(t);
    localStorage.setItem("token", t);
  };

  const handleLogout = () => {
    setToken("");
    localStorage.removeItem("token");
  };

  // ---- Admin auth — separate storage key, separate login screen ----
  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("adminToken") || ""
  );

  const handleAdminLogin = (t) => {
    setAdminToken(t);
    localStorage.setItem("adminToken", t);

    // Admin gets full access to the same AI tool pages a normal user sees
    // (Chat, Identity Risk, Cyber Lab, etc). Those pages read the "token"
    // key, so we mirror the admin token into it. If a real user session
    // already existed in this browser, we remember it so it isn't lost.
    const existingUserToken = localStorage.getItem("token");
    if (existingUserToken && existingUserToken !== t) {
      localStorage.setItem("preAdminUserToken", existingUserToken);
    }
    localStorage.setItem("token", t);
    setToken(t);
  };

  const handleAdminLogout = () => {
    setAdminToken("");
    localStorage.removeItem("adminToken");

    // Restore whatever normal-user session existed before, if any
    const restored = localStorage.getItem("preAdminUserToken");
    localStorage.removeItem("preAdminUserToken");
    if (restored) {
      localStorage.setItem("token", restored);
      setToken(restored);
    } else {
      localStorage.removeItem("token");
      setToken("");
    }
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage token={token} />} />

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />

      <Route
        path="/register"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <RegisterPage onLogin={handleLogin} />
          )
        }
      />

      {/* Protected Routes (normal users AND admin, since admin token is mirrored) */}
      <Route
        path="/dashboard"
        element={
          token ? (
            <DashboardPage token={token} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/chat"
        element={token ? <ChatPage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/reports"
        element={token ? <ReportsPage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/profile"
        element={
          token ? (
            <ProfilePage onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/identity-risk"
        element={
          token ? <IdentityRiskPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/human-risk"
        element={token ? <HumanRiskPage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/insider-threat"
        element={
          token ? <InsiderThreatPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/attack-story"
        element={
          token ? <AttackStoryPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/cyber-lab"
        element={token ? <CyberLabPage /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/security-decision"
        element={
          token ? <SecurityDecisionPage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/attack-surface"
        element={
          token ? <AttackSurfacePage /> : <Navigate to="/login" replace />
        }
      />

      <Route
        path="/file-analysis"
        element={
          token ? <FileAnalysisPage /> : <Navigate to="/login" replace />
        }
      />

      {/* ---------------------------------------------------- */}
      {/* ADMIN ROUTES — own login, own token, own dashboard    */}
      {/* ---------------------------------------------------- */}
      <Route
        path="/system-access-portal"
        element={
          adminToken ? (
            <Navigate to="/system-access-portal/dashboard" replace />
          ) : (
            <AdminLoginPage onAdminLogin={handleAdminLogin} />
          )
        }
      />

      <Route
        path="/system-access-portal/dashboard"
        element={
          adminToken ? (
            <AdminDashboardPage
              adminToken={adminToken}
              onAdminLogout={handleAdminLogout}
            />
          ) : (
            <Navigate to="/system-access-portal" replace />
          )
        }
      />

      {/* 404 Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}