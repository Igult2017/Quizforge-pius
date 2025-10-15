import { useState } from "react";
import { Header } from "@/components/Header";
import { QuizQuestion } from "@/components/QuizQuestion";
import { QuizNavigation } from "@/components/QuizNavigation";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
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

//todo: remove mock functionality
const mockQuestions = [
  {
    question: "A nurse is caring for a client who has been prescribed morphine sulfate for pain management. Which of the following assessments is the priority before administering the medication?",
    options: [
      "Check the client's blood pressure",
      "Assess the client's respiratory rate",
      "Evaluate the client's pain level",
      "Review the client's allergy history"
    ],
    correctAnswer: "Assess the client's respiratory rate"
  },
  {
    question: "Which lab value should be monitored for a patient on warfarin therapy?",
    options: [
      "Hemoglobin level",
      "INR (International Normalized Ratio)",
      "Serum creatinine",
      "Blood glucose"
    ],
    correctAnswer: "INR (International Normalized Ratio)"
  },
  {
    question: "A patient with heart failure is taking furosemide (Lasix). Which of the following should the nurse monitor?",
    options: [
      "Calcium levels",
      "Potassium levels",
      "Sodium intake only",
      "Protein levels"
    ],
    correctAnswer: "Potassium levels"
  }
];

export default function Quiz() {
  const [, setLocation] = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(Array(mockQuestions.length).fill(null));
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < mockQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleSubmit = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    console.log("Quiz submitted with answers:", answers);
    setLocation("/results");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} userName="Student" planType="Monthly Plan" />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">NCLEX Practice Quiz</h1>
            <p className="text-muted-foreground">
              Answer all questions and submit when you're ready
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            Safe and Effective Care Environment
          </Badge>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <QuizQuestion
            questionNumber={currentQuestion + 1}
            totalQuestions={mockQuestions.length}
            question={mockQuestions[currentQuestion].question}
            options={mockQuestions[currentQuestion].options}
            selectedAnswer={answers[currentQuestion]}
            onAnswerSelect={handleAnswerSelect}
          />

          <QuizNavigation
            currentQuestion={currentQuestion + 1}
            totalQuestions={mockQuestions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onSubmit={handleSubmit}
            canGoBack={currentQuestion > 0}
            canGoNext={answers[currentQuestion] !== null}
            isLastQuestion={currentQuestion === mockQuestions.length - 1}
          />
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your quiz? You have answered{" "}
              {answers.filter(a => a !== null).length} out of {mockQuestions.length} questions.
              You won't be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-submit">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} data-testid="button-confirm-submit">
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
