import { StatsCard } from "../StatsCard";
import { TrendingUp } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <StatsCard
        icon={TrendingUp}
        label="Pass Rate"
        value="95%"
        description="Students who improved scores"
      />
    </div>
  );
}
