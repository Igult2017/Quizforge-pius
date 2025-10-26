import { Header } from "@/components/Header";
import { ResultsCard } from "@/components/ResultsCard";
import { QuestionReview } from "@/components/QuestionReview";
import { Button } from "@/components/ui/button";
import { RotateCcw, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface QuizResult {
  attemptId: number;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  questions: {
    id: number;
    question: string;
    options: string[];
    userAnswer: string | null;
    correctAnswer: string;
    explanation: string;
  }[];
}

export default function Results() {
  const [, setLocation] = useLocation();
  
  // Get attemptId from URL params
  const attemptId = new URLSearchParams(window.location.search).get("attemptId");

  // Fetch quiz results
  const { data: results, isLoading, isError } = useQuery<QuizResult>({
    queryKey: ["/api/quiz", attemptId, "results"],
    enabled: !!attemptId,
  });

  const handleTryAgain = () => {
    setLocation("/categories");
  };

  const handleBackToCategories = () => {
    setLocation("/categories");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" data-testid="loader-results" />
            <p className="text-muted-foreground">Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !results) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load results. Please try again.</p>
            <Button onClick={handleBackToCategories} data-testid="button-back-categories-error">
              Back to Categories
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const reviewQuestions = results.questions.map(q => ({
    question: q.question,
    userAnswer: q.userAnswer,
    correctAnswer: q.correctAnswer,
    options: q.options,
    explanation: q.explanation,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2" data-testid="text-results-title">Quiz Results</h1>
            <p className="text-muted-foreground">
              Review your performance and learn from your mistakes
            </p>
          </div>

          <ResultsCard
            score={results.score}
            totalQuestions={results.totalQuestions}
            correctAnswers={results.correctAnswers}
            incorrectAnswers={results.incorrectAnswers}
            skippedAnswers={results.totalQuestions - results.correctAnswers - results.incorrectAnswers}
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

          <QuestionReview questions={reviewQuestions} />
        </div>
      </div>
    </div>
  );
}
