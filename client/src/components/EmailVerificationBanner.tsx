import { useState, useEffect } from "react";
import { Mail, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { resendVerificationEmail, checkEmailVerified } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        setIsVerified(null);
        return;
      }

      // Check local storage to see if user has dismissed this banner
      const dismissed = localStorage.getItem(`verification-banner-dismissed-${user.uid}`);
      if (dismissed) {
        setIsDismissed(true);
      }

      // Check if email is verified
      const verified = await checkEmailVerified();
      setIsVerified(verified);

      // If verified, clear any dismissal flag
      if (verified) {
        localStorage.removeItem(`verification-banner-dismissed-${user.uid}`);
      }
    };

    checkVerification();
  }, [user]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      toast({
        title: "Email sent!",
        description: "Verification email has been sent. Please check your inbox.",
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send email",
        description: error.message || "Please try again later",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(`verification-banner-dismissed-${user.uid}`, "true");
    }
    setIsDismissed(true);
  };

  // Don't show banner if:
  // - Email is verified
  // - User dismissed it
  // - Still checking verification status
  // - No user logged in
  if (!user || isVerified === null || isVerified || isDismissed) {
    return null;
  }

  return (
    <Alert className="mb-4 border-l-4 border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-semibold">Verify your email address</span> to ensure uninterrupted access to your account.
            We sent a verification email to <span className="font-medium">{user.email}</span>.
          </AlertDescription>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResend}
              disabled={isResending}
              data-testid="button-resend-verification"
            >
              {isResending ? "Sending..." : "Resend Email"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              data-testid="button-dismiss-verification"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6"
          data-testid="button-close-verification"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
}
