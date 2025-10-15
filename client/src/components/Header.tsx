import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { GraduationCap, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onSignIn?: () => void;
  onGetStarted?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  planType?: string;
}

export function Header({
  onSignIn,
  onGetStarted,
  isAuthenticated = false,
  userName,
  planType,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">NursePrep</span>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {planType && (
                <Badge variant="secondary" data-testid="badge-plan-type">
                  {planType}
                </Badge>
              )}
              <Button variant="ghost" size="icon" data-testid="button-profile">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </Button>
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
