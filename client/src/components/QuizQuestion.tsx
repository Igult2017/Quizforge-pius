import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface QuizQuestionProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  selectedAnswer: string | null;
  onAnswerSelect: (answer: string) => void;
}

export function QuizQuestion({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedAnswer,
  onAnswerSelect,
}: QuizQuestionProps) {
  return (
    <Card data-testid="card-quiz-question">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="font-mono" data-testid="text-question-number">
            Question {questionNumber} of {totalQuestions}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-relaxed">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerSelect}>
          <div className="space-y-3">
            {options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index);
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all hover-elevate ${
                    selectedAnswer === option
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                  data-testid={`option-${optionLabel.toLowerCase()}`}
                >
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                    className="mt-0.5"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer leading-relaxed"
                  >
                    <span className="font-semibold mr-2">{optionLabel}.</span>
                    {option}
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
