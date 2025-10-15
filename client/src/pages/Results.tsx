import { Header } from "@/components/Header";
import { ResultsCard } from "@/components/ResultsCard";
import { QuestionReview } from "@/components/QuestionReview";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { useLocation } from "wouter";

//todo: remove mock functionality
const mockReviewQuestions = [
  {
    question: "A nurse is caring for a client who has been prescribed morphine sulfate for pain management. Which of the following assessments is the priority before administering the medication?",
    userAnswer: "Assess the client's respiratory rate",
    correctAnswer: "Assess the client's respiratory rate",
    options: [
      "Check the client's blood pressure",
      "Assess the client's respiratory rate",
      "Evaluate the client's pain level",
      "Review the client's allergy history"
    ],
    explanation: "Respiratory rate is the priority assessment because morphine can cause respiratory depression, which is life-threatening. While other assessments are important, maintaining adequate respiratory function is critical for patient safety."
  },
  {
    question: "Which lab value should be monitored for a patient on warfarin therapy?",
    userAnswer: "Hemoglobin level",
    correctAnswer: "INR (International Normalized Ratio)",
    options: [
      "Hemoglobin level",
      "INR (International Normalized Ratio)",
      "Serum creatinine",
      "Blood glucose"
    ],
    explanation: "INR (International Normalized Ratio) is monitored to assess the effectiveness of warfarin therapy and prevent bleeding complications. The therapeutic range for most indications is 2.0-3.0."
  },
  {
    question: "A patient with heart failure is taking furosemide (Lasix). Which of the following should the nurse monitor?",
    userAnswer: "Potassium levels",
    correctAnswer: "Potassium levels",
    options: [
      "Calcium levels",
      "Potassium levels",
      "Sodium intake only",
      "Protein levels"
    ],
    explanation: "Furosemide is a loop diuretic that can cause potassium depletion (hypokalemia). Monitoring potassium levels is essential to prevent cardiac arrhythmias and other complications associated with low potassium."
  }
];

export default function Results() {
  const [, setLocation] = useLocation();

  const handleTryAgain = () => {
    console.log("Try again clicked");
    setLocation("/quiz");
  };

  const handleBackToCategories = () => {
    setLocation("/categories");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Quiz Results</h1>
            <p className="text-muted-foreground">
              Review your performance and learn from your mistakes
            </p>
          </div>

          <ResultsCard
            score={2}
            totalQuestions={3}
            correctAnswers={2}
            incorrectAnswers={1}
            skippedAnswers={0}
          />

          <div className="flex gap-4">
            <Button
              onClick={handleTryAgain}
              className="flex-1"
              data-testid="button-try-again"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={handleBackToCategories}
              variant="outline"
              className="flex-1"
              data-testid="button-back-categories"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </div>

          <QuestionReview questions={mockReviewQuestions} />
        </div>
      </div>
    </div>
  );
}
