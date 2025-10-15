import { Header } from "@/components/Header";
import { PricingCard } from "@/components/PricingCard";
import { CheckCircle2 } from "lucide-react";

export default function Pricing() {
  const handleSelectPlan = (plan: string) => {
    console.log(`${plan} plan selected`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onSignIn={() => console.log("Sign in")}
        onGetStarted={() => console.log("Get started")}
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
            title="Weekly Plan"
            price="$5"
            period="week"
            description="Perfect for intensive exam prep"
            features={[
              "Full access to all Nursing Test Banks",
              "ATI TEAS, NCLEX, HESI A2 practice",
              "Unlimited practice sessions",
              "Progress tracking & analytics",
              "24/7 expert support"
            ]}
            onSelect={() => handleSelectPlan("Weekly")}
          />

          <PricingCard
            title="Monthly Plan"
            price="$15"
            period="month"
            description="Consistent study, most popular"
            features={[
              "Everything in Weekly Plan",
              "Priority customer support",
              "Advanced study tools",
              "Monthly performance insights",
              "Access to exclusive webinars"
            ]}
            badge="Most Popular"
            highlighted={true}
            onSelect={() => handleSelectPlan("Monthly")}
          />

          <PricingCard
            title="3-Month Plan"
            price="$30"
            period="3 months"
            description="Biggest savings, complete mastery"
            features={[
              "Everything in Monthly Plan",
              "Premium customer support",
              "Extended study materials",
              "Quarterly performance insights",
              "Access to all future updates"
            ]}
            onSelect={() => handleSelectPlan("3-Month")}
          />
        </div>
      </div>
    </div>
  );
}
