import { Header } from "@/components/Header";
import { PricingCard } from "@/components/PricingCard";
import { CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useUserData } from "@/hooks/useUserData";

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, hasActiveSubscription, hasUsedFreeTrial, subscription } = useUserData();

  const handleFreeTrial = () => {
    if (isAuthenticated) {
      setLocation("/categories");
    } else {
      setLocation("/signup");
    }
  };

  const handlePaidPlan = (plan: string) => {
    if (isAuthenticated && hasActiveSubscription) {
      // Already subscribed - go to categories
      setLocation("/categories");
    } else {
      // Not subscribed - go to checkout
      setLocation(`/checkout?plan=${plan.toLowerCase()}`);
    }
  };

  const getButtonText = (planType: "free" | "paid", planName: string) => {
    if (!isAuthenticated) {
      return planType === "free" ? "Sign Up Free" : "Subscribe";
    }
    
    if (hasActiveSubscription) {
      const isCurrentPlan = subscription?.plan === planName.toLowerCase();
      return isCurrentPlan ? "Current Plan" : "Switch Plan";
    }
    
    if (hasUsedFreeTrial && planType === "free") {
      return "Trial Used";
    }
    
    return planType === "free" ? "Start Practice" : "Subscribe";
  };

  const isButtonDisabled = (planType: "free" | "paid", planName: string) => {
    if (!isAuthenticated) return false;
    
    if (hasActiveSubscription) {
      return subscription?.plan === planName.toLowerCase();
    }
    
    if (hasUsedFreeTrial && planType === "free") {
      return true;
    }
    
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSignIn={() => setLocation("/login")}
        onGetStarted={() => setLocation("/signup")}
      />

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Flexible Pricing for Every <span className="text-primary">Nursing Student</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            One subscription gives you access to all exams: NCLEX-RN, NCLEX-PN, ATI TEAS, HESI A2,
            and all nursing question banks. No hidden fees, no surprises.
          </p>

          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span>7-Day Money-Back Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span>One Subscription, All Exams</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            title="Free Trial"
            price="$0"
            period="one-time"
            description="Try before you subscribe"
            features={[
              "30 practice questions",
              "All question categories",
              "Detailed explanations"
            ]}
            buttonText={getButtonText("free", "free")}
            onSelect={handleFreeTrial}
            disabled={isButtonDisabled("free", "free")}
          />

          <PricingCard
            title="Monthly Plan"
            price="$15"
            period="month"
            description="Consistent study, most popular"
            features={[
              "Unlimited practice sessions",
              "50 questions per session",
              "All features included"
            ]}
            badge={hasActiveSubscription && subscription?.plan === "monthly" ? "Current Plan" : "Most Popular"}
            highlighted={true}
            buttonText={getButtonText("paid", "Monthly")}
            onSelect={() => handlePaidPlan("Monthly")}
            disabled={isButtonDisabled("paid", "monthly")}
          />

          <PricingCard
            title="Weekly Plan"
            price="$5"
            period="week"
            description="Perfect for intensive exam prep"
            features={[
              "Unlimited practice sessions",
              "50 questions per session",
              "All features included"
            ]}
            badge={hasActiveSubscription && subscription?.plan === "weekly" ? "Current Plan" : undefined}
            buttonText={getButtonText("paid", "Weekly")}
            onSelect={() => handlePaidPlan("Weekly")}
            disabled={isButtonDisabled("paid", "weekly")}
          />
        </div>
      </div>
    </div>
  );
}
