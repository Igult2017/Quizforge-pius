import { useLocation } from "wouter";

const COLUMNS = [
  {
    label: "Product",
    links: [
      { text: "Exams", href: "/exams" },
      { text: "Pricing", href: "/pricing" },
    ],
  },
  {
    label: "Company",
    links: [
      { text: "About Us", href: "/about" },
      { text: "Contact", href: "/contact" },
    ],
  },
  {
    label: "Resources",
    links: [
      { text: "FAQ", href: "/faq" },
      { text: "Sample Questions", href: "/sample-questions" },
    ],
  },
  {
    label: "Legal",
    links: [
      { text: "Privacy Policy", href: "/privacy" },
      { text: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  const [, navigate] = useLocation();

  return (
    <footer
      style={{ background: "#0f172a", fontFamily: "'Montserrat', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 py-12 md:py-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <span className="font-black text-2xl text-blue-500" style={{ letterSpacing: "-0.5px" }}>
              NurseBrace
            </span>
            <p className="mt-3 text-sm text-slate-400 font-medium leading-relaxed max-w-xs">
              Empowering nursing students to pass on the first try.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.label}>
              <p
                className="text-xs font-extrabold uppercase tracking-widest mb-4 pb-2 border-b border-white/10"
                style={{ color: "#e2e8f0" }}
              >
                {col.label}
              </p>
              {col.links.map((l) => (
                <a
                  key={l.text}
                  href="#"
                  className="block mb-2.5 text-sm font-medium text-slate-400 hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(l.href);
                  }}
                >
                  {l.text}
                </a>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.08] py-6">
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>
            © {new Date().getFullYear()} NurseBrace. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
