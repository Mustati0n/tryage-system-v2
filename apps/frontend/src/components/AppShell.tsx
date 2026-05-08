import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Role } from "../auth/types";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

type AppShellProps = {
  role: Role;
  children: React.ReactNode;
};

export function AppShell({ role, children }: AppShellProps) {
  const auth = useAuth();
  const location = useLocation();
  const [fullName, setFullName] = useState<string | null>(null);

  const readUsernameFromToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const payload = JSON.parse(atob(padded)) as { sub?: string };
      return payload.sub?.trim() || null;
    } catch {
      return null;
    }
  };

  const fallbackName = role === "ADMIN" ? "Sistem Yoneticisi" : "Personel";
  const username = (localStorage.getItem("username") || readUsernameFromToken() || fallbackName).trim();
  const currentUsername = (fullName || username).trim();
  const displayName = currentUsername.replace(/_/g, " ");
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() || "")
    .join("") || "AT";
  const lastLoginAt = localStorage.getItem("lastLoginAt");
  const roleBadgeText = role === "ADMIN" ? "ADMIN" : "PERSONEL";
  const hasPendingTriage = () => sessionStorage.getItem("personel.triage.pending") === "1";

  const confirmLeaveFromTriage = () => {
    if (!location.pathname.startsWith("/personel/triage")) return true;
    if (!hasPendingTriage()) return true;
    return window.confirm("Kaydedilmemis triyaj tahmini var. Bu sayfadan cikmak istedigine emin misin?");
  };

  const iconFor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("dashboard")) return "dashboard";
    if (lower.includes("kayit")) return "records";
    if (lower.includes("personel")) return "personnel";
    if (lower.includes("log")) return "logs";
    if (lower.includes("hasta")) return "patients";
    if (lower.includes("triyaj")) return "triage";
    return "dashboard";
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case "records":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 4h8l4 4v12H7z" />
            <path d="M15 4v5h5" />
            <path d="M10 13h6M10 17h6" />
          </svg>
        );
      case "personnel":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="9.5" cy="7" r="3" />
            <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 4.13a3 3 0 0 1 0 5.74" />
          </svg>
        );
      case "logs":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12h4l2-4 3 8 2-4h7" />
          </svg>
        );
      case "patients":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="16" rx="2.5" />
            <circle cx="8" cy="10" r="2.2" />
            <path d="M5.8 15.2c.7-1.8 2.1-2.7 4.2-2.7 2 0 3.4.9 4.1 2.7" />
            <path d="M14 9h4M14 12h4M14 15h3" />
          </svg>
        );
      case "triage":
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 12h4l2-3 3 6 2-3h5" />
            <circle cx="18" cy="6" r="2" />
          </svg>
        );
      case "dashboard":
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="8" height="8" rx="1.5" />
            <rect x="13" y="3" width="8" height="5" rx="1.5" />
            <rect x="13" y="10" width="8" height="11" rx="1.5" />
            <rect x="3" y="13" width="8" height="8" rx="1.5" />
          </svg>
        );
    }
  };

  const links =
    role === "ADMIN"
      ? [
          { to: "/admin/dashboard", label: "Admin Dashboard" },
          { to: "/admin/records", label: "Tum Kayitlar" },
          { to: "/admin/personnel", label: "Personel Yonetimi" },
          { to: "/admin/logs", label: "Sistem Loglari" },
        ]
      : [
          { to: "/personel/dashboard", label: "Personel Dashboard" },
          { to: "/personel/triage", label: "Triyaj" },
          { to: "/personel/patients", label: "Kayitli Hastalar" },
          { to: "/personel/records", label: "Kayitlarim" },
        ];

  const logoutWithConfirm = async () => {
    const message = hasPendingTriage()
      ? "Kaydedilmemis triyaj tahmini var. Cikarsan bu adim tamamlanmadan kalacak. Yine de cikmak istiyor musun?"
      : "Sistemden cikmak istedigine emin misin?";
    if (!window.confirm(message)) return;
    await auth.logout();
  };

  const title = useMemo(() => {
    if (role !== "ADMIN") {
      if (location.pathname.includes("/personel/triage")) return "Triyaj Kaydi Olustur";
      if (location.pathname.includes("/personel/patients")) return "Kayitli Hastalar";
      if (location.pathname.includes("/personel/records")) return "Kendi Kayitlarim";
      return "Personel Dashboard";
    }
    if (location.pathname.includes("/admin/records")) return "Tum Triyaj Kayitlari";
    if (location.pathname.includes("/admin/personnel")) return "Personel Yonetimi";
    if (location.pathname.includes("/admin/logs")) return "Sistem Loglari";
    return "Admin Dashboard";
  }, [location.pathname, role]);

  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      try {
        const { data } = await api.get<{ adSoyad?: string | null; kullaniciAdi: string }>("/api/auth/me");
        if (!cancelled && data.adSoyad && data.adSoyad.trim()) {
          setFullName(data.adSoyad.trim());
        } else if (!cancelled && data.kullaniciAdi) {
          setFullName(data.kullaniciAdi.trim());
        }
      } catch {
        if (!cancelled) {
          setFullName(null);
        }
      }
    };
    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand-row">
          <div className="app-brand-left">
            <div className="brand-logo">⌁</div>
            <div>
              <div className="app-brand">Akilli Triyaj</div>
              <div className="app-role">{role === "ADMIN" ? "Admin" : "Personel"}</div>
            </div>
          </div>
          <button className="app-sidebar-close" type="button" aria-label="Menüyü kapat">
            ×
          </button>
        </div>
        <nav className="app-nav">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              onClick={(e) => {
                if (!confirmLeaveFromTriage()) {
                  e.preventDefault();
                }
              }}
              className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}>
              <span className={`app-nav-icon app-nav-icon-${iconFor(link.label)}`} aria-hidden="true">
                {renderIcon(iconFor(link.label))}
              </span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-user-card">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <div className="app-user-meta">
              <span className={`app-role-badge ${role === "ADMIN" ? "admin" : "personel"}`}>{roleBadgeText}</span>
              {lastLoginAt ? (
                <p>Son giris: {new Date(lastLoginAt).toLocaleString("tr-TR")}</p>
              ) : (
                <p>{role === "ADMIN" ? "Yonetici" : "Personel"}</p>
              )}
            </div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={() => void logoutWithConfirm()}>
          Cikis Yap
        </button>
      </aside>

      <div className="app-content">
        <header className="app-topbar">
          <h1>{title}</h1>
        </header>
        <div>{children}</div>
      </div>
    </div>
  );
}
