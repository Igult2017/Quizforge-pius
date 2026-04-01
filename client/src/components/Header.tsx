import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, Settings, User, LogOut } from "lucide-react";
import { logout } from "@/lib/firebase";
import { useUserData } from "@/hooks/useUserData";

interface HeaderProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

const NAV_LINKS = [
  { label: "Exams", href: "/exams" },
  { label: "Pricing", href: "/pricing" },
  { label: "Sample Questions", href: "/sample-questions" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header({ onSignIn, onGetStarted }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, userData, hasActiveSubscription, allFreeTrialsUsed, subscription } = useUserData();
  const isAdmin = userData?.isAdmin || false;

  const close = () => setMenuOpen(false);
  const handleSignIn = () => { (onSignIn || (() => setLocation("/login")))(); close(); };
  const handleGetStarted = () => { (onGetStarted || (() => setLocation("/signup")))(); close(); };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "white",
        borderBottom: "3px solid #2563eb",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 28px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontWeight: 900,
            fontSize: 22,
            color: "#2563eb",
            letterSpacing: "-0.5px",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onClick={close}
        >
          NurseBrace
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ gap: 32, alignItems: "center" }}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                color: "#333",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                transition: "color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={e => (e.currentTarget.style.color = "#333")}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex" style={{ gap: 10, alignItems: "center" }}>
          {isAuthenticated ? (
            <>
              {/* Subscription / admin badge */}
              {isAdmin ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 20, padding: "3px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Crown style={{ width: 12, height: 12 }} /> Admin
                </span>
              ) : hasActiveSubscription ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", border: "1.5px solid #2563eb", borderRadius: 20, padding: "3px 12px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Crown style={{ width: 12, height: 12 }} />
                  {subscription?.plan === "weekly" ? "Weekly" : "Monthly"} Plan
                </span>
              ) : allFreeTrialsUsed ? (
                <button
                  onClick={() => setLocation("/pricing")}
                  style={{ background: "#2563eb", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1d4ed8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#2563eb")}
                >
                  <Crown style={{ width: 13, height: 13 }} /> Subscribe
                </button>
              ) : (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#555", border: "1.5px solid #ddd", borderRadius: 20, padding: "3px 12px" }}>
                  Free Trial
                </span>
              )}

              {isAdmin && (
                <button
                  onClick={() => setLocation("/admin")}
                  style={{ background: "transparent", color: "#2563eb", border: "2px solid #2563eb", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Settings style={{ width: 13, height: 13 }} /> Admin
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{ background: "transparent", border: "1.5px solid #e5e7eb", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <User style={{ width: 16, height: 16, color: "#555" }} />
                    <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}>Profile</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {userData?.firstName && userData?.lastName
                      ? `${userData.firstName} ${userData.lastName}`
                      : userData?.email || "Student"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut style={{ width: 16, height: 16, marginRight: 8 }} />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                onClick={handleSignIn}
                style={{ background: "transparent", color: "#2563eb", border: "2px solid #2563eb", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#eff6ff")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                style={{ background: "#2563eb", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1d4ed8"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.transform = "translateY(0)"; }}
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 8, flexDirection: "column", gap: 5 }}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <>
              <span style={{ display: "block", width: 24, height: 2.5, background: "#2563eb", borderRadius: 2 }} />
              <span style={{ display: "block", width: 24, height: 2.5, background: "#2563eb", borderRadius: 2 }} />
              <span style={{ display: "block", width: 18, height: 2.5, background: "#2563eb", borderRadius: 2 }} />
            </>
          )}
        </button>
      </div>

      {/* Mobile menu — full-screen overlay */}
      {menuOpen && (
        <div
          className="md:hidden"
          style={{ position: "fixed", inset: 0, background: "white", zIndex: 200, display: "flex", flexDirection: "column", padding: "88px 28px 40px", gap: 0 }}
        >
          <button
            onClick={close}
            style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", padding: 8 }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>

          <span style={{ fontWeight: 900, fontSize: 22, color: "#2563eb", marginBottom: 16 }}>NurseBrace</span>

          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              style={{ color: "#1e293b", textDecoration: "none", fontSize: 20, fontWeight: 800, padding: "18px 0", borderBottom: "1px solid #f1f5f9", display: "block" }}
            >
              {l.label}
            </Link>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <button
                    onClick={() => { setLocation("/admin"); close(); }}
                    style={{ background: "transparent", color: "#2563eb", border: "2px solid #2563eb", padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <Settings style={{ width: 16, height: 16 }} /> Admin Panel
                  </button>
                )}
                <button
                  onClick={() => { logout(); close(); }}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <LogOut style={{ width: 16, height: 16 }} /> Log Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSignIn}
                  style={{ width: "100%", background: "transparent", color: "#2563eb", border: "2px solid #2563eb", padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  style={{ width: "100%", background: "#2563eb", color: "white", border: "none", padding: 14, borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
