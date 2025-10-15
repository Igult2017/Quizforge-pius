import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ReviewQuestion {
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  options: string[];
  explanation?: string;
}

interface QuestionReviewProps {
  questions: ReviewQuestion[];
}

export function QuestionReview({ questions }: QuestionReviewProps) {
  return (
    <Card data-testid="card-question-review">
      <CardHeader>
        <CardTitle>Review Your Answers</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {questions.map((q, idx) => {
            const isCorrect = q.userAnswer === q.correctAnswer;
            const optionLabel = (option: string) => {
              const index = q.options.indexOf(option);
              return index >= 0 ? String.fromCharCode(65 + index) : "";
            };

            return (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border rounded-lg px-4"
                data-testid={`review-question-${idx + 1}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          Question {idx + 1}
                        </span>
                        <Badge variant={isCorrect ? "default" : "destructive"} className="text-xs">
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                      </div>
                      <div className="text-sm line-clamp-1">{q.question}</div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4 space-y-4">
                  <div className="text-sm leading-relaxed">{q.question}</div>
                  <div className="space-y-2">
                    {q.options.map((option, optIdx) => {
                      const label = optionLabel(option);
                      const isUserAnswer = q.userAnswer === option;
                      const isCorrectOption = q.correctAnswer === option;

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-lg border-2 ${
                            isCorrectOption
                              ? "border-green-500 bg-green-500/10"
                              : isUserAnswer
                              ? "border-red-500 bg-red-500/10"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {isCorrectOption && (
                              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5" />
                            )}
                            {isUserAnswer && !isCorrectOption && (
                              <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5" />
                            )}
                            <span className="text-sm">
                              <span className="font-semibold mr-2">{label}.</span>
                              {option}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="p-4 bg-primary/5 rounded-lg border-l-4 border-l-primary">
                      <div className="font-semibold text-sm mb-1">Explanation</div>
                      <div className="text-sm text-muted-foreground">{q.explanation}</div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
