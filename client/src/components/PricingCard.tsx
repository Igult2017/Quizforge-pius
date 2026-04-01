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

const CheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="10" cy="10" r="10" fill="#22c55e" />
    <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Map verbose period names to the short display form shown in the design
function formatPeriod(period: string): string {
  switch (period.toLowerCase()) {
    case "month": return "/mo";
    case "week":  return "/wk";
    case "one-time":
    case "":      return "";
    default:      return `/${period}`;
  }
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
  const periodLabel = formatPeriod(period);

  return (
    <div
      data-testid={`card-plan-${title.toLowerCase().replace(/\s+/g, "-")}`}
      style={{
        position: "relative",
        background: "white",
        borderRadius: 20,
        padding: "36px 28px",
        boxShadow: highlighted
          ? "0 8px 40px rgba(37,99,235,0.18)"
          : "0 2px 16px rgba(0,0,0,0.08)",
        border: highlighted ? "2px solid #2563eb" : "2px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "transform 0.2s",
        fontFamily: "'Montserrat', sans-serif",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
    >
      {/* Badge */}
      {badge && (
        <div style={{
          position: "absolute",
          top: -16,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#2563eb",
          color: "white",
          borderRadius: 20,
          padding: "5px 18px",
          fontSize: 12,
          fontWeight: 800,
          whiteSpace: "nowrap",
          letterSpacing: 0.3,
        }}>
          {badge}
        </div>
      )}

      {/* Title */}
      <h3 style={{ fontWeight: 800, fontSize: 22, color: "#111827", marginBottom: 6, marginTop: badge ? 8 : 0 }}>
        {title}
      </h3>

      {/* Price */}
      <p style={{ fontWeight: 900, fontSize: 36, color: "#2563eb", lineHeight: 1.1, marginBottom: 2 }}>
        {price}
        {periodLabel && (
          <span style={{ fontSize: 15, fontWeight: 600, color: "#9ca3af" }}>{periodLabel}</span>
        )}
      </p>

      {/* Description */}
      <p style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, marginBottom: 22, marginTop: 4 }}>
        {description}
      </p>

      {/* Features */}
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {features.map((feature, idx) => (
          <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <CheckCircle />
            <span style={{ fontSize: 14, color: "#374151", fontWeight: 500, lineHeight: 1.5 }}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        data-testid={`button-select-${title.toLowerCase().replace(/\s+/g, "-")}`}
        onClick={onSelect}
        disabled={disabled}
        style={{
          width: "100%",
          padding: "14px 0",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 800,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.55 : 1,
          transition: "all 0.15s",
          border: highlighted ? "none" : "2px solid #2563eb",
          background: highlighted ? "#2563eb" : "white",
          color: highlighted ? "white" : "#2563eb",
          marginTop: "auto",
        }}
      >
        {buttonText || `Choose ${title}`}
      </button>
    </div>
  );
}
