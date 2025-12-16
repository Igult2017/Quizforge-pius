import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
}

export function QuizNavigation({
  currentQuestion,
  totalQuestions,
  answeredCount,
  onPrevious,
  onNext,
  onSubmit,
  canGoBack,
  canGoNext,
  isLastQuestion,
}: QuizNavigationProps) {
  // Progress based on questions answered, not current position
  const progress = (answeredCount / totalQuestions) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Question {currentQuestion} of {totalQuestions}</span>
          <span className="font-mono font-semibold" data-testid="text-progress">
            {answeredCount}/{totalQuestions} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={!canGoBack}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        {isLastQuestion ? (
          <Button
            className="flex-1"
            onClick={onSubmit}
            data-testid="button-submit"
          >
            Submit Quiz
          </Button>
        ) : (
          <Button
            className="flex-1"
            onClick={onNext}
            disabled={!canGoNext}
            data-testid="button-next"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
