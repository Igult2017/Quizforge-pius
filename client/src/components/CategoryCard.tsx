import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";

interface CategoryCardProps {
  title: string;
  description: string;
  questionCount: string;
  features: string[];
  progress?: number;
  color: "purple" | "orange" | "teal";
  iconSrc?: string;
  onStart: () => void;
  locked?: boolean;
  freeTrialAvailable?: boolean;
}

const colorStyles = {
  purple: "border-l-[#8B5CF6] bg-gradient-to-br from-purple-500/5 to-transparent",
  orange: "border-l-[#FB923C] bg-gradient-to-br from-orange-500/5 to-transparent",
  teal: "border-l-[#14B8A6] bg-gradient-to-br from-teal-500/5 to-transparent",
};

const colorButtons = {
  purple: "from-purple-600 to-purple-500",
  orange: "from-orange-600 to-orange-500",
  teal: "from-teal-600 to-teal-500",
};

export function CategoryCard({
  title,
  description,
  questionCount,
  features,
  progress = 0,
  color,
  iconSrc,
  onStart,
  locked = false,
  freeTrialAvailable = false,
}: CategoryCardProps) {
  return (
    <Card className={`border-l-4 ${colorStyles[color]} hover-elevate transition-all ${locked ? 'opacity-60' : ''}`} data-testid={`card-category-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {iconSrc && (
              <div className="w-12 h-12 mb-2 rounded-lg overflow-hidden">
                <img src={iconSrc} alt={title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {locked && (
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              Locked
            </Badge>
          )}
          {!locked && freeTrialAvailable && (
            <Badge variant="outline" className="gap-1">
              Free Trial
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono font-semibold">{questionCount}</span>
        </div>
        <div className="space-y-2">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        {progress > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className={`w-full ${locked ? 'bg-muted text-muted-foreground' : `bg-gradient-to-r ${colorButtons[color]} text-white hover:opacity-90`}`}
          onClick={onStart}
          disabled={locked}
          data-testid={`button-start-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {locked ? (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Subscribe to Unlock
            </>
          ) : (
            <>
              Start Practice
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
