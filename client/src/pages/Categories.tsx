import { Header } from "@/components/Header";
import { CategoryCard } from "@/components/CategoryCard";
import nclexIcon from "@assets/generated_images/NCLEX_stethoscope_icon_fdac6417.png";
import teasIcon from "@assets/generated_images/TEAS_study_books_icon_e557edc3.png";
import hesiIcon from "@assets/generated_images/HESI_brain_knowledge_icon_67dac13b.png";
import { useLocation } from "wouter";

export default function Categories() {
  const [, setLocation] = useLocation();

  const handleStartPractice = (category: string) => {
    console.log(`Starting ${category} practice`);
    setLocation(`/quiz?category=${encodeURIComponent(category)}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />

      <div className="container mx-auto px-4 py-12">
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
            progress={42}
            color="teal"
            iconSrc={hesiIcon}
            onStart={() => handleStartPractice("HESI A2")}
          />
        </div>
      </div>
    </div>
  );
}
