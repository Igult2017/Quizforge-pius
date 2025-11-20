import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GraduationCap, User, LogOut, Crown, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/firebase";
import { useUserData } from "@/hooks/useUserData";

interface HeaderProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export function Header({
  onSignIn,
  onGetStarted,
}: HeaderProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, userData, hasActiveSubscription, allFreeTrialsUsed } = useUserData();
  const isAdmin = userData?.isAdmin || false;
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">NurseBrace</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-pricing">
              Pricing
            </Link>
            <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-nav-contact">
              Contact
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <Badge variant="secondary" className="gap-1" data-testid="badge-admin-access">
                  <Crown className="h-3 w-3" />
                  Admin Access
                </Badge>
              ) : hasActiveSubscription ? (
                <Badge variant="secondary" className="gap-1" data-testid="badge-plan-type">
                  <Crown className="h-3 w-3" />
                  {userData?.subscription?.plan === "weekly" ? "Weekly" : "Monthly"} Plan
                </Badge>
              ) : allFreeTrialsUsed ? (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setLocation("/pricing")}
                  data-testid="button-subscribe"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Subscribe
                </Button>
              ) : (
                <Badge variant="outline" data-testid="badge-free-trial">
                  Free Trial
                </Badge>
              )}
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/admin")}
                  data-testid="button-admin-panel"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="button-profile">
                    <User className="h-5 w-5" />
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
                  <DropdownMenuItem onClick={() => logout()} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onSignIn} data-testid="button-signin">
                Sign In
              </Button>
              <Button onClick={onGetStarted} data-testid="button-getstarted">
                Get Started
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
