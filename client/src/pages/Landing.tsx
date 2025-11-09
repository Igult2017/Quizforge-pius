import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, TrendingUp, Award, ArrowRight, Check, Users, Star, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { useUserData } from "@/hooks/useUserData";
import nurseImage1 from "@assets/stock_images/professional_nurse_h_3a5fecdd.jpg";
import nurseImage2 from "@assets/stock_images/professional_nurse_h_9b50f451.jpg";
import nurseImage3 from "@assets/stock_images/professional_nurse_h_6647a984.jpg";
import React from "react";

export default function Landing() {
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
      setLocation("/categories");
    } else {
      setLocation(`/checkout?plan=${plan.toLowerCase()}`);
    }
  };

  const getButtonText = (planType: "free" | "paid", planName: string) => {
    if (!isAuthenticated) {
      return planType === "free" ? "Start Free Trial" : "Subscribe";
    }
    
    if (hasActiveSubscription) {
      const isCurrentPlan = subscription?.plan === planName.toLowerCase();
      return isCurrentPlan ? "Current Plan" : "Go to Practice";
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

  // --- GraphicalTrialButton Component with Fallback ---
  const GraphicalTrialButton: React.FC = () => {
    const BLUE = "#2563EB";

    try {
      return (
        <Link href="/signup">
          <button className="relative block group outline-none focus:ring-4 focus:ring-blue-300 transition duration-300">
            <div className="absolute inset-0 z-0">
              <svg width="250" height="70" viewBox="0 0 250 70" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute">
                <rect x="2" y="2" width="246" height="66" rx="33" stroke="black" strokeWidth="2" strokeDasharray="6 6"/>
                <rect x="7" y="7" width="236" height="56" rx="28" fill={BLUE} />
                <line x1="25" y1="10" x2="225" y2="10" stroke="black" strokeWidth="1.5" />
                <line x1="25" y1="60" x2="225" y2="60" stroke="black" strokeWidth="1.5" />
                <circle cx="10" cy="35" r="4" fill={BLUE} stroke="black" strokeWidth="1.5" />
                <circle cx="70" cy="10" r="3" fill="black" />
                <circle cx="125" cy="10" r="3" fill="black" />
                <circle cx="180" cy="10" r="3" fill="black" />
                <circle cx="240" cy="35" r="4" fill={BLUE} stroke="black" strokeWidth="1.5" />
              </svg>
            </div>
            <div className="relative z-10 w-[250px] h-[70px] flex items-center justify-center">
              <span className="text-white font-extrabold text-xl tracking-wider group-hover:scale-[1.03] transition-transform duration-300">
                START FREE TRIAL
              </span>
            </div>
          </button>
        </Link>
      );
    } catch (error) {
      console.warn("GraphicalTrialButton failed, using fallback", error);
      return (
        <Link href="/signup">
          <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700 px-8">
            START FREE TRIAL
          </Button>
        </Link>
      );
    }
  };
  // --- End GraphicalTrialButton ---

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onSignIn={() => setLocation("/login")}
        onGetStarted={() => setLocation("/signup")}
      />
      {/* Hero Section */}
      <section style={{ backgroundColor: '#1e40af' }} className="py-16 md:py-24 lg:py-32">
        {/* ... existing hero content ... */}
      </section>

      {/* Practice, Learn, and Pass Section */}
      <section className="py-16 px-4 bg-muted/30">
        {/* ... existing section content ... */}
      </section>

      {/* Features Grid and Pricing Section */}
      <section className="py-16 px-4">
        {/* ... existing cards and pricing content ... */}
      </section>

      {/* Why Choose NurseBrace Section */}
      <section className="py-16 px-4 bg-background">
        {/* ... existing cards and description content ... */}
      </section>

      {/* ----------- New Footer Inline ----------- */}
      <footer className="bg-white text-black shadow-2xl shadow-gray-200 border-t border-gray-300">
        {!isAuthenticated && (
          <div className="py-16 px-4 bg-white border-b border-gray-200">
            <div className="container mx-auto max-w-6xl text-center">
              <h3 className="text-3xl font-extrabold text-gray-900 mb-8">Ready to Empower Your Practice?</h3>
              <GraphicalTrialButton />
            </div>
          </div>
        )}

        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-6 lg:gap-x-12">
            <div className="col-span-2 md:col-span-2">
              <h4 className="text-3xl font-extrabold mb-3 text-blue-600">NurseBrace</h4>
              <p className="text-gray-700 text-lg">Empowering healthcare professionals.</p>
            </div>

            <div className="col-span-1">
              <h5 className="font-extrabold text-gray-900 mb-6 uppercase text-base tracking-widest border-b-2 border-blue-500/50 pb-2 inline-block">Product</h5>
              <ul className="space-y-4 text-base">
                <li><Link href="/features" className="text-gray-700">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-700">Pricing</Link></li>
                <li><Link href="/integrations" className="text-gray-700">Integrations</Link></li>
                <li><Link href="/updates" className="text-gray-700">Latest Updates</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h5 className="font-extrabold text-gray-900 mb-6 uppercase text-base tracking-widest border-b-2 border-blue-500/50 pb-2 inline-block">Company</h5>
              <ul className="space-y-4 text-base">
                <li><Link href="/about" className="text-gray-700">About Us</Link></li>
                <li><Link href="/careers" className="text-gray-700">Careers</Link></li>
                <li><Link href="/contact" className="text-gray-700">Contact</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h5 className="font-extrabold text-gray-900 mb-6 uppercase text-base tracking-widest border-b-2 border-blue-500/50 pb-2 inline-block">Resources</h5>
              <ul className="space-y-4 text-base">
                <li><Link href="/guides" className="text-gray-700">User Guides</Link></li>
                <li><Link href="/faq" className="text-gray-700">FAQ</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h5 className="font-extrabold text-gray-900 mb-6 uppercase text-base tracking-widest border-b-2 border-blue-500/50 pb-2 inline-block">Legal</h5>
              <ul className="space-y-4 text-base">
                <li><Link href="/privacy" className="text-gray-700">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-700">Terms of Service</Link></li>
                <li><Link href="/cookie" className="text-gray-700">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-300 py-8 px-4 bg-gray-100">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-gray-700 text-sm font-medium">© 2025 NurseBrace. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
