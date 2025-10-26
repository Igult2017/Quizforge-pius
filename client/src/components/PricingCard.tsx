import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  badge?: string;
  highlighted?: boolean;
  onSelect: () => void;
  buttonText?: string;
  disabled?: boolean;
}

export function PricingCard({
  title,
  price,
  period,
  description,
  features,
  badge,
  highlighted = false,
  onSelect,
  buttonText,
  disabled = false,
}: PricingCardProps) {
  return (
    <Card
      className={`relative ${highlighted ? "border-primary border-2 shadow-lg" : ""}`}
      data-testid={`card-plan-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-purple-600 to-purple-500 text-white">
            {badge}
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="flex items-baseline gap-1 mt-4">
          <span className="text-4xl font-bold" data-testid={`text-price-${title.toLowerCase()}`}>{price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${highlighted ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:opacity-90" : ""}`}
          variant={highlighted ? "default" : "outline"}
          onClick={onSelect}
          disabled={disabled}
          data-testid={`button-select-${title.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {buttonText || `Choose ${title}`}
        </Button>
      </CardFooter>
    </Card>
  );
}
