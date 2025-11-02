// src/components/Sidebar.jsx
import React, { useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import { useAuthStore } from "../store/authStore";

const primaryMenu = [
  { label: "Home", icon: "home", href: "/home" },
  { label: "Task Management", icon: "tasks", href: "/tasks" },
  { label: "Calendar", icon: "calendar", href: "/calendar" },
  { label: "ChatBot", icon: "chat", href: "/chatbot" },
  { label: "Analytics", icon: "chart", href: "/analytics" },
];

const generalMenu = [
  { label: "Settings", icon: "settings", href: "/settings" },
  { label: "Sign out", icon: "logout", href: "#" },
];

function Icon({ name, active }) {
  const cls = `h-5 w-5 ${active ? "text-accent" : "text-gray-500"}`;
  return (
    <svg
      viewBox="0 0 24 24"
      className={cls}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "home" && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      )}
      {name === "tasks" && (
        <>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M8 9h8M8 13h5" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </>
      )}
      {name === "chat" && (
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      )}
      {name === "chart" && (
        <>
          <path d="M3 21h18" />
          <rect x="5" y="12" width="3" height="6" rx="1" />
          <rect x="10" y="9" width="3" height="9" rx="1" />
          <rect x="15" y="6" width="3" height="12" rx="1" />
        </>
      )}
      {name === "settings" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .66.26 1.3.73 1.77.47.47 1.11.73 1.77.73H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </>
      )}
      {name === "logout" && (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </>
      )}
    </svg>
  );
}

export default function Sidebar({ active }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const path = location?.pathname || "/";
  const { clearAuth } = useAuthStore(); // Zustand logout action

  // Complete logout: clears Zustand, localStorage, sessionStorage, and cookies
  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:4000";

      // Optional backend logout
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }).catch(() => {});

      // Clear Zustand store instantly
      clearAuth?.();

      // Clear all local/session storage items
      const keysToRemove = [
        "auth-store",
        "token",
        "user",
        "access",
        "access_token",
        "userEmail",
        "userId",
        "userRole",
      ];
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      sessionStorage.clear();

      // Clear cookies
      document.cookie.split(";").forEach((cookie) => {
        document.cookie = cookie
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
      });

      // Redirect to login
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <aside
      className="hidden lg:flex w-[18rem] shrink-0 flex-col rounded-2xl bg-card border border-gray-200 p-6 gap-4 shadow-sm"
      aria-label="Primary"
    >
      <div className="w-full flex items-center justify-center gap-0 py-3">
        <img src="/logo.png" alt="Calm Mind Logo" className="h-16 w-16" />
        <img
          src="/calmtxt.svg"
          alt="Calm Mind"
          className="h-9 object-contain"
        />
      </div>

      <nav className="flex-1 text-[15px]" role="navigation">
        <div className="uppercase text-gray-400 text-[11px] px-3 mb-2">
          Menu
        </div>
        <ul className="space-y-2">
          {primaryMenu.map((m) => {
            const isActive =
              typeof active === "string"
                ? m.label === active
                : path.startsWith(m.href);
            return (
              <li key={m.label}>
                <Link
                  to={m.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? "bg-card text-accent font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-accent" />
                  )}
                  <Icon name={m.icon} active={isActive} />
                  <span className="truncate">{m.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="uppercase text-gray-400 text-[11px] px-3 mt-6 mb-2">
          General
        </div>
        <ul className="space-y-1">
          {generalMenu.map((m) => {
            const isActive = path === m.href;

            if (m.label === "Sign out") {
              return (
                <li key={m.label}>
                  <button
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 ${
                      isActive ? "text-accent font-semibold" : "text-gray-700"
                    }`}
                  >
                    <Icon name={m.icon} active={isActive} />
                    <span className="truncate">{m.label}</span>
                  </button>
                </li>
              );
            }

            return (
              <li key={m.label}>
                <Link
                  to={m.href}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 ${
                    isActive ? "text-accent font-semibold" : "text-gray-700"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-accent" />
                  )}
                  <Icon name={m.icon} active={isActive} />
                  <span className="truncate">{m.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-2 pb-1">
        <div className="flex items-center gap-3">
          <div
            className={`theme-switch ${theme === "dark" ? "dark" : ""}`}
            role="group"
            aria-label="Theme toggle"
          >
            <button
              type="button"
              className="sun-button"
              aria-pressed={theme === "light"}
              aria-label="Switch to light mode"
              onClick={() => setTheme("light")}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <g
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="M4.93 4.93l1.41 1.41" />
                  <path d="M17.66 17.66l1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="M4.93 19.07l1.41-1.41" />
                  <path d="M17.66 6.34l1.41-1.41" />
                </g>
              </svg>
            </button>

            <button
              type="button"
              className="knob-button"
              aria-hidden="true"
              tabIndex={-1}
            />

            <button
              type="button"
              className="moon-button"
              aria-pressed={theme === "dark"}
              aria-label="Switch to dark mode"
              onClick={() => setTheme("dark")}
            >
              <svg
                className="moon moon-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
