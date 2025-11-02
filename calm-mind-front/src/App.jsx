// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import SignupScreen from "./pages/SignupScreen";
import LoginScreen from "./pages/LoginScreen";
import ForgotPassword from "./pages/ForgotPassword";
import Homepage from "./pages/Homepage";
import TaskManagement from "./pages/TaskManagement";
import Calendar from "./pages/Calendar";
import ChatBot from "./pages/ChatBot";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import GetStarted from "./pages/GetStarted";
import SettingsLogin from "./pages/SettingsLogin";
import SettingsAbout from "./pages/SettingsAbout";
import AdminHomepage from "./pages/admin/AdminHomepage";
import { useAuthStore } from "./store/authStore";
import api from "./api/client";

const ProtectedRoute = ({ children, redirectTo = "/login" }) => {
  const { token, logout } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      const localToken = token || localStorage.getItem("token");

      if (!localToken) {
        logout();
        setIsValid(false);
        setIsChecking(false);
        return;
      }

      try {
        const res = await api.get("http://localhost:4000/api/users/profile", {
          headers: { Authorization: `Bearer ${localToken}` },
        });

        if (res.status === 200 && res.data?.user) {
          setIsValid(true);
        } else {
          logout();
          setIsValid(false);
        }
      } catch (err) {
        console.warn(
          "Invalid or expired token:",
          err.response?.data || err.message
        );
        logout();
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    verifyToken();
  }, [token, logout]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

function UsersPage() {
  return <div>Users Page (Under Construction)</div>;
}

function ReportsPage() {
  return <div>Reports Page (Under Construction)</div>;
}

function NotFoundPage() {
  return (
    <div className="text-center mt-20">
      <h1 className="text-2xl font-bold mb-2">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-4">
        The page you’re looking for doesn’t exist.
      </p>
      <div className="space-x-3">
        <a href="/home" className="text-blue-600 hover:underline">
          Go to Home
        </a>
        <span>|</span>
        <a href="/admin" className="text-blue-600 hover:underline">
          Go to Admin Dashboard
        </a>
      </div>
    </div>
  );
}

/* Main App */
function App() {
  const { token: storeToken, user, logout } = useAuthStore();
  const token = storeToken || localStorage.getItem("token");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "token") {
        if (!event.newValue) {
          logout();
        } else if (event.newValue && !storeToken) {
          window.location.href = "/home";
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout, storeToken]);

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Default / Public Routes */}
          <Route
            path="/"
            element={token ? <Navigate to="/home" replace /> : <SignupScreen />}
          />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected User Routes */}
          <Route
            path="/get-started"
            element={
              <ProtectedRoute>
                <GetStarted />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chatbot"
            element={
              <ProtectedRoute>
                <ChatBot />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/login"
            element={
              <ProtectedRoute>
                <SettingsLogin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/about"
            element={
              <ProtectedRoute>
                <SettingsAbout />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              token && isAdmin ? (
                <AdminHomepage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/admins" element={<Navigate to="/admin" replace />} />
          <Route
            path="/admin/users"
            element={
              token && isAdmin ? (
                <UsersPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/admin/reports"
            element={
              token && isAdmin ? (
                <ReportsPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
