import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Circle } from "lucide-react";

interface ResultsCardProps {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
}

export function ResultsCard({
  score,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  skippedAnswers,
}: ResultsCardProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const isPassing = percentage >= 70;

  return (
    <Card className="border-l-4 border-l-primary" data-testid="card-results">
      <CardHeader>
        <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        <CardDescription>
          Here's how you performed on this practice session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center p-6 bg-primary/5 rounded-lg">
          <div className="text-6xl font-bold text-primary mb-2" data-testid="text-score-percentage">
            {percentage}%
          </div>
          <Badge variant={isPassing ? "default" : "destructive"} className="text-sm">
            {isPassing ? "Passing" : "Keep Practicing"}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-500" />
            </div>
            <div className="text-2xl font-bold" data-testid="text-correct-count">{correctAnswers}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>

          <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex justify-center mb-2">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <div className="text-2xl font-bold" data-testid="text-incorrect-count">{incorrectAnswers}</div>
            <div className="text-sm text-muted-foreground">Incorrect</div>
          </div>

          <div className="text-center p-4 bg-muted rounded-lg border">
            <div className="flex justify-center mb-2">
              <Circle className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold" data-testid="text-skipped-count">{skippedAnswers}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
