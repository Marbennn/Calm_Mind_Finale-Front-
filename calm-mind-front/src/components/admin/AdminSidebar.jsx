// src/components/admin/AdminSidebar.jsx
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ThemeContext } from "../../context/ThemeContext";
import { useAuthStore } from "../../store/authStore";

const adminMenu = [
  { label: "Dashboard", icon: "chart", href: "/admin" },
  { label: "Reports", icon: "reports", href: "/admin/reports" },
  { label: "Sign Out", icon: "logout", href: "#" },
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
      {name === "chart" && (
        <>
          <path d="M3 21h18" />
          <rect x="5" y="12" width="3" height="6" rx="1" />
          <rect x="10" y="9" width="3" height="9" rx="1" />
          <rect x="15" y="6" width="3" height="12" rx="1" />
        </>
      )}
      {name === "users" && (
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <circle cx="16" cy="7" r="4" />
        </>
      )}
      {name === "reports" && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M6 12h12M6 16h12" />
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

export default function AdminSidebar({ active }) {
  const { theme, setTheme } = useContext(ThemeContext);
  const { serverLogout, logout } = useAuthStore();
  const location = useLocation();
  const path = location?.pathname || "/admin";

  const handleSignOut = () => {
    // Prefer server logout; fallback to local logout
    try { serverLogout?.(); } catch { logout?.(); }
  };

  return (
    <aside
      className="hidden lg:flex w-[18rem] shrink-0 flex-col rounded-2xl bg-card border border-gray-200 p-6 gap-4 shadow-sm"
      aria-label="Admin Navigation"
    >
      <div className="w-full flex items-center justify-center gap-0 py-3">
        <img src="/logo.png" alt="Calm Mind Logo" className="h-16 w-16" />
        <img src="/calmtxt.svg" alt="Calm Mind" className="h-9 object-contain" />
      </div>

      <nav className="flex-1 text-[15px]" role="navigation">
        <div className="uppercase text-gray-400 text-[11px] px-3 mb-2">Admin Menu</div>
        <ul className="space-y-2">
          {adminMenu.map((m) => {
            const isActive = typeof active === "string" ? m.label === active : path.startsWith(m.href);
            return (
              <li key={m.label}>
                {m.label === "Sign Out" ? (
                  <a
                    href="#"
                    onClick={handleSignOut}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive ? "bg-card text-accent font-semibold" : "text-gray-700"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-accent" />
                    )}
                    <Icon name={m.icon} active={isActive} />
                    <span className="truncate">{m.label}</span>
                  </a>
                ) : (
                  <Link
                    to={m.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isActive ? "bg-card text-accent font-semibold" : "text-gray-700"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute -left-4 top-1/2 -translate-y-1/2 h-6 w-1 rounded bg-accent" />
                    )}
                    <Icon name={m.icon} active={isActive} />
                    <span className="truncate">{m.label}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto px-2 pb-1">
        <div className="flex items-center gap-3">
          <div className={`theme-switch ${theme === "dark" ? "dark" : ""}`} role="group" aria-label="Theme toggle">
            <button
              type="button"
              className="sun-button"
              aria-pressed={theme === "light"}
              aria-label="Switch to light mode"
              onClick={() => setTheme("light")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTheme("light");
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
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

            <button type="button" className="knob-button" aria-hidden="true" tabIndex={-1} />

            <button
              type="button"
              className="moon-button"
              aria-pressed={theme === "dark"}
              aria-label="Switch to dark mode"
              onClick={() => setTheme("dark")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTheme("dark");
              }}
            >
              <svg className="moon moon-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}