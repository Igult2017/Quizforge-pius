import { PricingCard } from "../PricingCard";

export default function PricingCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <PricingCard
        title="Monthly Plan"
        price="$15"
        period="month"
        description="Consistent study, most popular"
        features={[
          "Everything in Weekly Plan",
          "Priority customer support",
          "Advanced study tools",
          "Monthly performance insights",
          "Access to exclusive webinars"
        ]}
        badge="Most Popular"
        highlighted={true}
        onSelect={() => console.log("Monthly plan selected")}
      />
    </div>
  );
}
