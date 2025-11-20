import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import nclexIcon from "@assets/generated_images/NCLEX_stethoscope_icon_fdac6417.png";
import teasIcon from "@assets/generated_images/TEAS_study_books_icon_e557edc3.png";
import hesiIcon from "@assets/generated_images/HESI_brain_knowledge_icon_67dac13b.png";
import { useLocation } from "wouter";
import { useUserData } from "@/hooks/useUserData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Categories() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasActiveSubscription, nclexFreeTrialUsed, teasFreeTrialUsed, hesiFreeTrialUsed, userData, refetch, isLoading: userLoading } = useUserData();

  // Refetch user data when page becomes visible (to update free trial status after quiz)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        refetch();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, refetch]);

  // Helper function to safely check admin access expiry
  const hasValidAdminAccess = () => {
    if (!userData?.adminGrantedAccess) return false;
    if (!userData?.adminAccessExpiresAt) return true; // No expiry = permanent access
    
    try {
      const expiryDate = new Date(userData.adminAccessExpiresAt);
      // Check if date is valid
      if (isNaN(expiryDate.getTime())) return false;
      return expiryDate > new Date();
    } catch {
      return false;
    }
  };

  // Admin and subscribers can access all categories
  const canAccessAll = hasActiveSubscription || userData?.isAdmin || hasValidAdminAccess();

  const handleStartPractice = (category: string) => {
    // Check if authentication is still loading
    if (authLoading || userLoading) {
      return; // Disable button while loading
    }

    // Check if user is authenticated
    if (!isAuthenticated || !userData) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to start practicing.",
        variant: "default",
      });
      setLocation("/login");
      return;
    }

    // Check if category is locked
    const isLocked = !canAccessAll && (
      (category === "NCLEX" && nclexFreeTrialUsed) ||
      (category === "TEAS" && teasFreeTrialUsed) ||
      (category === "HESI" && hesiFreeTrialUsed)
    );

    if (isLocked) {
      toast({
        title: "Free Trial Used",
        description: `You've already used your free trial for ${category}. Subscribe to continue practicing.`,
        variant: "default",
      });
      setLocation("/pricing");
      return;
    }

    console.log(`Starting ${category} practice`);
    setLocation(`/quiz?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Email Verification Banner */}
        <EmailVerificationBanner />

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Choose Your Practice Category</h1>
          <p className="text-lg text-muted-foreground">
            Select an exam category to start your practice session
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CategoryCard
            title="NCLEX Practice"
            description="Master your RN or PN licensing exam with comprehensive practice questions."
            questionCount="5,000+ RN & PN questions"
            features={[
              "Exam simulations",
              "Detailed explanations",
              "All subject areas"
            ]}
            progress={35}
            color="purple"
            iconSrc={nclexIcon}
            onStart={() => handleStartPractice("NCLEX")}
            locked={(!canAccessAll && nclexFreeTrialUsed) || authLoading || userLoading}
            freeTrialAvailable={!canAccessAll && !nclexFreeTrialUsed && !authLoading && !userLoading}
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
            progress={68}
            color="orange"
            iconSrc={teasIcon}
            onStart={() => handleStartPractice("TEAS")}
            locked={(!canAccessAll && teasFreeTrialUsed) || authLoading || userLoading}
            freeTrialAvailable={!canAccessAll && !teasFreeTrialUsed && !authLoading && !userLoading}
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
            progress={42}
            color="teal"
            iconSrc={hesiIcon}
            onStart={() => handleStartPractice("HESI")}
            locked={(!canAccessAll && hesiFreeTrialUsed) || authLoading || userLoading}
            freeTrialAvailable={!canAccessAll && !hesiFreeTrialUsed && !authLoading && !userLoading}
          />
        </div>
      </div>
    </div>
  );
}
