import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  description?: string;
}

export function StatsCard({ icon: Icon, label, value, description }: StatsCardProps) {
  return (
    <Card className="hover-elevate transition-all" data-testid={`card-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold" data-testid={`text-value-${label.toLowerCase().replace(/\s+/g, '-')}`}>{value}</div>
            {description && (
              <div className="text-xs text-muted-foreground mt-1">{description}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
