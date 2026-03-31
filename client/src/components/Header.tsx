import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Crown, Settings, User, LogOut } from "lucide-react";
import { logout } from "@/lib/firebase";
import { useUserData } from "@/hooks/useUserData";

interface HeaderProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export function Header({ onSignIn, onGetStarted }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, userData, hasActiveSubscription, allFreeTrialsUsed } = useUserData();
  const isAdmin = userData?.isAdmin || false;

  const NAV_LINKS = [
    { label: "Exams", href: "/exams" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b-[3px] border-blue-600 shadow-sm">
      <div
        style={{ fontFamily: "'Montserrat', sans-serif" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"
      >
        {/* Logo */}
        <Link
          href="/"
          className="font-black text-xl text-blue-600 tracking-tight select-none"
          style={{ letterSpacing: "-0.5px" }}
          onClick={close}
        >
          NurseBrace
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-600 font-semibold text-gray-600 hover:text-blue-600 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Subscription / admin badge */}
              {isAdmin ? (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Admin
                </Badge>
              ) : hasActiveSubscription ? (
                <Badge variant="secondary" className="gap-1">
                  <Crown className="h-3 w-3" />
                  {userData?.subscription?.plan === "weekly" ? "Weekly" : "Monthly"} Plan
                </Badge>
              ) : allFreeTrialsUsed ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setLocation("/pricing")}
                  className="bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  <Crown className="mr-1.5 h-3.5 w-3.5" />
                  Subscribe
                </Button>
              ) : (
                <Badge variant="outline">Free Trial</Badge>
              )}

              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/admin")}
                  className="font-bold border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Settings className="mr-1.5 h-3.5 w-3.5" />
                  Admin
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-gray-200"
                  >
                    <User className="h-4 w-4" />
                    <span className="sr-only">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {userData?.firstName && userData?.lastName
                      ? `${userData.firstName} ${userData.lastName}`
                      : userData?.email || "Student"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                className="text-sm font-bold text-blue-600 border-2 border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                onClick={onSignIn || (() => setLocation("/login"))}
              >
                Sign In
              </button>
              <button
                className="text-sm font-bold text-white bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={onGetStarted || (() => setLocation("/signup"))}
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-blue-600"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-white z-40 flex flex-col px-6 pt-6 pb-10 gap-0 border-t border-gray-100"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-lg font-extrabold text-gray-800 py-4 border-b border-gray-100 block"
              onClick={close}
            >
              {l.label}
            </Link>
          ))}

          <div className="flex flex-col gap-3 mt-6">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Button
                    className="font-bold border-blue-600 text-blue-600 bg-transparent border-2 hover:bg-blue-50"
                    onClick={() => { setLocation("/admin"); close(); }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="font-bold"
                  onClick={() => { logout(); close(); }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </Button>
              </>
            ) : (
              <>
                <button
                  className="w-full text-base font-bold text-blue-600 border-2 border-blue-600 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                  onClick={() => { (onSignIn || (() => setLocation("/login")))(); close(); }}
                >
                  Sign In
                </button>
                <button
                  className="w-full text-base font-bold text-white bg-blue-600 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => { (onGetStarted || (() => setLocation("/signup")))(); close(); }}
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
