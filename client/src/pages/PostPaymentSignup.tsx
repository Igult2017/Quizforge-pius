import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { signupWithEmail } from "@/lib/firebase";

export default function PostPaymentSignup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get merchantReference from URL params
  const params = new URLSearchParams(window.location.search);
  const merchantReference = params.get("merchantReference") || params.get("OrderMerchantReference");
  const reference = params.get("reference") || params.get("OrderTrackingId"); // Support both Paystack and PesaPal

  useEffect(() => {
    const verifyPayment = async () => {
      if (!merchantReference) {
        setError("Invalid payment reference. Please contact support.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest("POST", "/api/payments/verify", {
          merchantReference,
          reference,
        });

        const data = await response.json();

        if (data.success && data.payment) {
          setPaymentData(data.payment);
        } else {
          setError("Payment verification failed. Please contact support.");
        }
      } catch (err: any) {
        console.error("Payment verification error:", err);
        setError("Failed to verify payment. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [merchantReference, reference]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please enter and confirm your password.",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Passwords Don't Match",
        description: "Please ensure both passwords match.",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create Firebase account
      const userCredential = await signupWithEmail(paymentData.email, password);
      const userId = userCredential.user.uid;

      // Step 2: Link payment to user account with email verification
      const linkResponse = await apiRequest("POST", "/api/payments/link-to-user", {
        merchantReference,
        userId,
        userEmail: paymentData.email,
      });

      const linkData = await linkResponse.json();

      if (!linkData.success) {
        throw new Error(linkData.error || "Failed to link payment to account");
      }

      toast({
        title: "Account Created!",
        description: "Your account has been created successfully. You can now start practicing.",
      });

      // Redirect to categories page
      setTimeout(() => {
        setLocation("/categories");
      }, 1500);
    } catch (err: any) {
      console.error("Account creation error:", err);
      toast({
        variant: "destructive",
        title: "Account Creation Failed",
        description: err.message || "Could not create your account. Please contact support.",
      });
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onSignIn={() => setLocation("/login")}
          onGetStarted={() => setLocation("/signup")}
        />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" data-testid="loader-verify-payment" />
            <p className="text-muted-foreground">Verifying your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onSignIn={() => setLocation("/login")}
          onGetStarted={() => setLocation("/signup")}
        />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Payment Verification Failed
                </CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setLocation("/contact")}
                  className="w-full"
                  data-testid="button-contact-support"
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const planDetails: Record<string, { price: string; name: string; duration: string }> = {
    weekly: { price: "$19.99", name: "Weekly Plan", duration: "7 days" },
    monthly: { price: "$49.99", name: "Monthly Plan", duration: "30 days" },
  };

  const currentPlan = planDetails[paymentData?.plan] || {};

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSignIn={() => setLocation("/login")}
        onGetStarted={() => setLocation("/signup")}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Payment <span className="text-primary">Successful!</span>
            </h1>
            <p className="text-muted-foreground">
              Complete your account setup to start practicing
            </p>
          </div>

          <div className="grid gap-6">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Your subscription is ready</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <span className="font-semibold">{currentPlan.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold">{currentPlan.price}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="font-semibold">{paymentData?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-semibold">{currentPlan.duration}</span>
                </div>
              </CardContent>
            </Card>

            {/* Account Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>
                  Set a password to complete your account setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter a strong password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isCreating}
                      data-testid="input-password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isCreating}
                      data-testid="input-confirm-password"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isCreating}
                    data-testid="button-create-account"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account & Start Learning"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
