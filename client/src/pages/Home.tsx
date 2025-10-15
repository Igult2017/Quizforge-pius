import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryCard } from "@/components/CategoryCard";
import { StatsCard } from "@/components/StatsCard";
import { PricingCard } from "@/components/PricingCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Star, Clock } from "lucide-react";
import nclexIcon from "@assets/generated_images/NCLEX_stethoscope_icon_fdac6417.png";
import teasIcon from "@assets/generated_images/TEAS_study_books_icon_e557edc3.png";
import hesiIcon from "@assets/generated_images/HESI_brain_knowledge_icon_67dac13b.png";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  const handleGetStarted = () => {
    console.log("Get started clicked");
    setLocation("/pricing");
  };

  const handleSignIn = () => {
    console.log("Sign in clicked");
  };

  const handleStartPractice = (category: string) => {
    console.log(`Starting ${category} practice`);
    setLocation("/categories");
  };

  return (
    <div className="min-h-screen">
      <Header onSignIn={handleSignIn} onGetStarted={handleGetStarted} />
      
      <Hero onGetStarted={handleGetStarted} />

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Practice, Learn, and <span className="text-primary">Pass</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master every nursing exam with targeted practice, detailed explanations, and proven
            study strategies designed for your success.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <CategoryCard
            title="NCLEX Practice"
            description="Master your RN or PN licensing exam with comprehensive practice questions."
            questionCount="5,000+ RN & PN questions"
            features={[
              "Exam simulations",
              "Detailed explanations",
              "All subject areas"
            ]}
            progress={0}
            color="purple"
            iconSrc={nclexIcon}
            onStart={() => handleStartPractice("NCLEX")}
          />

          <CategoryCard
            title="ATI TEAS Prep"
            description="Ace your nursing school entrance exam with targeted practice questions."
            questionCount="2,500+ TEAS questions"
            features={[
              "All subject areas",
              "Practice tests",
              "Math & Science focus"
            ]}
            progress={0}
            color="orange"
            iconSrc={teasIcon}
            onStart={() => handleStartPractice("ATI TEAS")}
          />

          <CategoryCard
            title="HESI A2 Study"
            description="Master math and science concepts for nursing school admission success."
            questionCount="1,500+ HESI questions"
            features={[
              "Math & Science focus",
              "Performance tracking",
              "Comprehensive coverage"
            ]}
            progress={0}
            color="teal"
            iconSrc={hesiIcon}
            onStart={() => handleStartPractice("HESI A2")}
          />
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">NursePrep</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to pass your nursing exams, all in one place
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={TrendingUp}
              label="Pass Rate"
              value="95%"
              description="Students improved scores"
            />
            <StatsCard
              icon={Users}
              label="Students Helped"
              value="10,000+"
              description="Across the country"
            />
            <StatsCard
              icon={Star}
              label="Student Rating"
              value="4.9/5"
              description="Based on reviews"
            />
            <StatsCard
              icon={Clock}
              label="Free Trial"
              value="3 Days"
              description="No credit card needed"
            />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Flexible Pricing for Every <span className="text-primary">Nursing Student</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One subscription gives you access to all exams: NCLEX-RN, NCLEX-PN, ATI TEAS, HESI A2,
            and all nursing question banks. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
            onSelect={() => console.log("Weekly plan selected")}
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
            onSelect={() => console.log("Monthly plan selected")}
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
            onSelect={() => console.log("3-month plan selected")}
          />
        </div>
      </section>

      <section className="bg-gradient-to-r from-blue-600 to-blue-500 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Nursing Career?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of nursing students who've improved their scores and confidence
            with our comprehensive practice questions and detailed explanations.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8"
            onClick={handleGetStarted}
            data-testid="button-cta-getstarted"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 NursePrep. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
