import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Shield, Lock, CheckCircle2 } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";
import { useQuery } from "@tanstack/react-query";

export default function Checkout() {
  const [, setLocationState] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, userData } = useUserData();
  
  // Get plan from URL params
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "";
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Auto-fill form with user data if authenticated
  useEffect(() => {
    if (isAuthenticated && userData) {
      setFormData({
        email: userData.email || "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        phone: "",
      });
    }
  }, [isAuthenticated, userData]);

  const planDetails: Record<string, { price: string; name: string }> = {
    weekly: { price: "$5", name: "Weekly Plan" },
    monthly: { price: "$15", name: "Monthly Plan" },
  };

  const currentPlan = planDetails[plan];

  useEffect(() => {
    if (!plan || !currentPlan) {
      toast({
        variant: "destructive",
        title: "Invalid Plan",
        description: "Please select a valid plan from the pricing page.",
      });
      setLocationState("/pricing");
    }
  }, [plan, currentPlan, setLocationState, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/payments/create-order", {
        plan,
        ...formData,
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Redirect to PesaPal payment page
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("Failed to create payment order");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: "Could not process your payment. Please try again.",
      });
      setIsLoading(false);
    }
  };

  if (!currentPlan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-poppins">
      <style dangerouslySetInnerHTML={{ __html: `
        .checkout-section h1, 
        .checkout-section h2, 
        .checkout-section h3, 
        .checkout-section h4, 
        .checkout-section h5, 
        .checkout-section h6 {
          font-family: 'Poppins', sans-serif !important;
        }
        .checkout-section {
          font-family: 'Poppins', sans-serif !important;
        }
      `}} />
      <Header
        onSignIn={() => setLocationState("/login")}
        onGetStarted={() => setLocationState("/signup")}
      />

      <div className="container mx-auto px-4 py-12 checkout-section">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Secure <span className="text-primary">Checkout</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Subscribe to {currentPlan.name} and start your exam preparation
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-3">
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Lock className="h-6 w-6 text-primary" />
                    Payment Details
                  </CardTitle>
                  <CardDescription className="text-base">
                    Complete the form below to proceed with secure payment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Accepted Payment Methods */}
                  <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-3">We Accept</div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded border">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-semibold">Visa</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded border">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                        <span className="text-sm font-semibold">Mastercard</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded border">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-semibold">Amex</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-background rounded border">
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-semibold">All Cards</span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-base">First Name *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          data-testid="input-firstname"
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-base">Last Name *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          type="text"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          disabled={isLoading}
                          data-testid="input-lastname"
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-base">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        data-testid="input-email"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your receipt and account details will be sent here
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-base">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="e.g., +1 (555) 123-4567"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        data-testid="input-phone"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        International format accepted (include country code)
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold"
                        disabled={isLoading}
                        data-testid="button-proceed-payment"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-5 w-5" />
                            Continue to Secure Payment
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="flex flex-col items-center gap-3 pt-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span>256-bit SSL encrypted payment</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span>7-day money-back guarantee</span>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-2">
              <Card className="border-2 sticky top-4">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Selected Plan</div>
                    <div className="text-xl font-bold text-primary">{currentPlan.name}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">{currentPlan.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-base">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">Total Due</span>
                        <span className="text-2xl font-bold text-primary">{currentPlan.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Billed {plan === "weekly" ? "weekly" : "monthly"}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-5 space-y-3">
                    <div className="text-sm font-semibold mb-3">What's Included</div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Unlimited practice sessions</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">50 questions per quiz session</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">All exam categories (NCLEX, TEAS, HESI)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Detailed answer explanations</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Real-time progress tracking</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Cancel anytime, no commitments</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
