import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { QuizQuestion } from "@/components/QuizQuestion";
import { QuizNavigation } from "@/components/QuizNavigation";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button as UIButton } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuizAttempt {
  attemptId: number;
  questions: QuizQuestion[];
}

export default function Quiz() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [attemptId, setAttemptId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  // Get category from URL params or default to NCLEX
  const category = new URLSearchParams(window.location.search).get("category") || "NCLEX";

  // Start quiz mutation
  const startQuizMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/quiz/start", {
        category,
      });
      return await res.json() as QuizAttempt;
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setQuestions(data.questions);
      setAnswers(Array(data.questions.length).fill(null));
      setSubscriptionError(null);
    },
    onError: (error: Error) => {
      // Check for subscription error first (403 status)
      if (error.message.includes("403:") || error.message.includes("Subscription required")) {
        setSubscriptionError("Your free trial has been used. Please subscribe to continue practicing.");
      } else if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Save answer mutation
  const saveAnswerMutation = useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: number; answer: string }) => {
      if (!attemptId) throw new Error("No attempt ID");
      const res = await apiRequest("POST", `/api/quiz/${attemptId}/answer`, {
        questionId,
        userAnswer: answer,
      });
      return await res.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save answer",
        description: error.message || "Please try selecting your answer again.",
        variant: "destructive",
      });
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!attemptId) throw new Error("No attempt ID");
      const res = await apiRequest("POST", `/api/quiz/${attemptId}/submit`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz"] });
      setLocation(`/results?attemptId=${attemptId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit quiz",
        description: error.message || "Please try submitting again.",
        variant: "destructive",
      });
      setShowSubmitDialog(false);
    },
  });

  // Start quiz on mount
  useEffect(() => {
    startQuizMutation.mutate();
  }, []);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);

    // Save answer to backend
    if (questions[currentQuestion]) {
      saveAnswerMutation.mutate({
        questionId: questions[currentQuestion].id,
        answer,
      });
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    submitQuizMutation.mutate();
  };

  // Loading state
  if (startQuizMutation.isPending) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" data-testid="loader-quiz-start" />
            <p className="text-muted-foreground">Loading your quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Subscription error state
  if (subscriptionError) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Free Trial Used" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="max-w-md">
            <Alert data-testid="alert-subscription-required">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Subscription Required</AlertTitle>
              <AlertDescription className="mt-2">
                {subscriptionError}
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-3 justify-center">
              <UIButton
                onClick={() => setLocation("/pricing")}
                data-testid="button-view-pricing"
              >
                View Pricing
              </UIButton>
              <UIButton
                variant="outline"
                onClick={() => setLocation("/categories")}
                data-testid="button-back-categories"
              >
                Back to Categories
              </UIButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (startQuizMutation.isError) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load quiz. Please try again.</p>
            <button
              onClick={() => startQuizMutation.mutate()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
              data-testid="button-retry-quiz"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-muted-foreground">No questions available for this category.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-quiz-title">{category} Practice Quiz</h1>
            <p className="text-muted-foreground">
              Answer all questions and submit when you're ready
            </p>
          </div>
          <Badge variant="secondary" className="text-sm" data-testid="badge-category">
            {category}
          </Badge>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <QuizQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={questions.length}
            question={questions[currentQuestion].question}
            options={questions[currentQuestion].options}
            selectedAnswer={answers[currentQuestion]}
            onAnswerSelect={handleAnswerSelect}
          />

          <QuizNavigation
            currentQuestion={currentQuestion + 1}
            totalQuestions={questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            canGoBack={currentQuestion > 0}
            canGoNext={answers[currentQuestion] !== null}
            isLastQuestion={currentQuestion === questions.length - 1}
          />
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your quiz? You have answered{" "}
              {answers.filter(a => a !== null).length} out of {questions.length} questions.
              You won't be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSubmit}
              disabled={submitQuizMutation.isPending}
              data-testid="button-confirm-submit"
            >
              {submitQuizMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Quiz"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
