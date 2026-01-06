import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MathRenderer } from "./MathRenderer";

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
    <Card data-testid="card-quiz-question" className="shadow-lg border-primary/10">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="px-3 py-1 font-mono text-xs font-semibold tracking-wider uppercase bg-primary/10 text-primary border-none" data-testid="text-question-number">
            Question {questionNumber} of {totalQuestions}
          </Badge>
          <div className="flex gap-1">
             <div className="h-1.5 w-8 rounded-full bg-primary/20 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                />
             </div>
          </div>
        </div>
        <CardTitle className="text-xl md:text-2xl font-semibold leading-relaxed tracking-tight text-foreground/90">
          <MathRenderer text={question} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <RadioGroup value={selectedAnswer || ""} onValueChange={onAnswerSelect}>
          <div className="grid gap-3">
            {options.map((option, index) => {
              const optionLabel = String.fromCharCode(65 + index);
              const isSelected = selectedAnswer === option;
              return (
                <div
                  key={index}
                  className={`group relative flex items-start space-x-4 p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:border-primary/40 hover:bg-accent/5 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-md"
                      : "border-border bg-card shadow-sm"
                  }`}
                  data-testid={`option-${optionLabel.toLowerCase()}`}
                  onClick={() => onAnswerSelect(option)}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 group-hover:border-primary/50"
                  }`}>
                    <span className="text-xs font-bold">{optionLabel}</span>
                  </div>
                  <Label
                    htmlFor={`option-${index}`}
                    className="flex-1 cursor-pointer text-base md:text-lg leading-relaxed font-medium transition-colors group-hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MathRenderer text={option} />
                  </Label>
                  {isSelected && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
