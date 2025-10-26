import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, Shield } from "lucide-react";

export default function Checkout() {
  const [, setLocationState] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get plan from URL params
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "";
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

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
    <div className="min-h-screen bg-background">
      <Header
        onSignIn={() => setLocationState("/login")}
        onGetStarted={() => setLocationState("/signup")}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Complete Your <span className="text-primary">Payment</span>
            </h1>
            <p className="text-muted-foreground">
              Enter your details to subscribe to {currentPlan.name}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                  <CardDescription>
                    You'll be redirected to PesaPal for secure payment processing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
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
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
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
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
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
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+1234567890"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={isLoading}
                        data-testid="input-phone"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-proceed-payment"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Proceed to Payment
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Secured by PesaPal</span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Plan</div>
                    <div className="font-semibold">{currentPlan.name}</div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Subtotal</span>
                      <span className="font-semibold">{currentPlan.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">{currentPlan.price}</span>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="text-sm font-semibold mb-2">What's included:</div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Unlimited practice sessions</li>
                      <li>• 50 questions per session</li>
                      <li>• All question categories</li>
                      <li>• Detailed explanations</li>
                      <li>• Progress tracking</li>
                    </ul>
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
