import { Header } from "@/components/Header";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const LAST_UPDATED = "January 1, 2026";

interface Section {
  title: string;
  content: (string | { heading: string; text: string })[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Information We Collect",
    content: [
      "We collect information you provide directly to us when you create an account, subscribe to a plan, or contact us for support.",
      {
        heading: "Account Information",
        text: "When you register, we collect your name, email address, and password (stored as a secure hash). If you sign in with Google, we receive your name, email, and profile picture from Google.",
      },
      {
        heading: "Payment Information",
        text: "Payments are processed by Paystack, a PCI-DSS compliant payment provider. NurseBrace never stores your full card number, CVV, or bank account details on our servers.",
      },
      {
        heading: "Usage Data",
        text: "We automatically collect information about how you interact with the platform — including quiz attempts, scores, topics practiced, session duration, and device/browser information — to personalise your experience and improve our service.",
      },
      {
        heading: "Communications",
        text: "If you contact us by email or via our contact form, we retain the content of your messages and your contact details in order to respond to you.",
      },
    ],
  },
  {
    title: "2. How We Use Your Information",
    content: [
      "We use the information we collect to:",
      {
        heading: "Provide and improve our service",
        text: "Deliver the platform features you access, personalise your study experience, track your progress, and continuously improve question quality and platform performance.",
      },
      {
        heading: "Process transactions",
        text: "Manage subscriptions, process payments through Paystack, and send you receipts and billing-related communications.",
      },
      {
        heading: "Communicate with you",
        text: "Send you account-related notifications (e.g. password resets, subscription confirmations) and, where you have opted in, occasional product updates or promotional offers. You can unsubscribe from marketing emails at any time.",
      },
      {
        heading: "Ensure security",
        text: "Detect, investigate, and prevent fraudulent transactions, abuse, and other illegal activities, and protect the rights and property of NurseBrace and our users.",
      },
    ],
  },
  {
    title: "3. Sharing of Information",
    content: [
      "We do not sell, rent, or trade your personal information to third parties. We share your information only in the following limited circumstances:",
      {
        heading: "Service Providers",
        text: "We share data with trusted third-party providers who help us operate the platform — including Firebase (authentication and hosting), Paystack (payment processing), and email delivery services. These providers are contractually bound to use your data only to perform services for us.",
      },
      {
        heading: "Legal Requirements",
        text: "We may disclose your information if required to do so by law, court order, or government authority, or when we believe in good faith that disclosure is necessary to protect our rights, protect your safety or the safety of others, or investigate fraud.",
      },
      {
        heading: "Business Transfers",
        text: "If NurseBrace is acquired by or merged with another company, your information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.",
      },
    ],
  },
  {
    title: "4. Data Retention",
    content: [
      "We retain your account and usage data for as long as your account is active. If you delete your account, we will delete or anonymise your personal information within 30 days, except where we are required to retain it for legal, tax, or fraud-prevention purposes.",
      "Anonymised, aggregated data (e.g. overall pass-rate statistics) may be retained indefinitely as it cannot identify you.",
    ],
  },
  {
    title: "5. Security",
    content: [
      "We use industry-standard security measures to protect your information:",
      {
        heading: "Encryption",
        text: "All data transmitted between your browser and our servers is encrypted using TLS (HTTPS). Passwords are never stored in plain text.",
      },
      {
        heading: "Authentication",
        text: "We use Firebase Authentication, which provides secure, battle-tested identity management. We support Google Sign-In and email/password authentication with rate limiting to prevent brute-force attacks.",
      },
      "No method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.",
    ],
  },
  {
    title: "6. Cookies",
    content: [
      "We use session cookies and local storage to keep you logged in and to remember your preferences. We do not use third-party advertising cookies.",
      "You can configure your browser to refuse cookies, but some parts of the platform may not function properly without them.",
    ],
  },
  {
    title: "7. Children's Privacy",
    content: [
      "NurseBrace is intended for users who are 16 years of age or older. We do not knowingly collect personal information from children under 16. If you believe we have inadvertently collected such information, please contact us immediately at nursebracehelp@gmail.com and we will delete it promptly.",
    ],
  },
  {
    title: "8. Your Rights",
    content: [
      "Depending on your location, you may have rights regarding your personal data, including:",
      {
        heading: "Access & Portability",
        text: "You can request a copy of the personal data we hold about you.",
      },
      {
        heading: "Correction",
        text: "You can update most of your account information directly within your profile settings. Contact us to correct information you cannot change yourself.",
      },
      {
        heading: "Deletion",
        text: "You can request deletion of your account and personal data at any time by contacting nursebracehelp@gmail.com.",
      },
      {
        heading: "Opt-out of marketing",
        text: "You can unsubscribe from marketing emails by clicking the 'unsubscribe' link in any email we send you, or by contacting us directly.",
      },
    ],
  },
  {
    title: "9. Third-Party Links",
    content: [
      "Our platform may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to read their privacy policies before providing any personal information.",
    ],
  },
  {
    title: "10. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. When we do, we will revise the 'Last Updated' date at the top of this page and, where the changes are material, notify you by email or via a prominent notice on the platform.",
      "Your continued use of NurseBrace after the effective date of any changes constitutes your acceptance of the updated policy.",
    ],
  },
  {
    title: "11. Contact Us",
    content: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy, please contact us:",
      {
        heading: "Email",
        text: "nursebracehelp@gmail.com",
      },
      {
        heading: "WhatsApp",
        text: "+1 979 304 2463",
      },
      {
        heading: "Support Hours",
        text: "Monday–Friday 9:00 AM – 8:00 PM EST · Saturday 10:00 AM – 6:00 PM EST",
      },
    ],
  },
];

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5">
            <Shield className="h-3.5 w-3.5" /> Legal
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-sm md:text-base opacity-80 font-medium">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10 text-sm text-blue-800 leading-relaxed">
          <strong>Summary:</strong> NurseBrace collects only the information needed to provide our service. We do not sell your data. We use industry-standard security. You can request deletion of your data at any time.
        </div>

        <div className="space-y-10">
          {SECTIONS.map((section, si) => (
            <section key={si}>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.content.map((item, ii) =>
                  typeof item === "string" ? (
                    <p key={ii} className="text-gray-600 leading-relaxed text-sm md:text-base">
                      {item}
                    </p>
                  ) : (
                    <div key={ii} className="pl-4 border-l-4 border-blue-200">
                      <p className="font-bold text-gray-800 mb-1 text-sm md:text-base">
                        {item.heading}
                      </p>
                      <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                        {item.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 border-t border-gray-200 pt-8 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} NurseBrace. All rights reserved.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/terms")}>
              Terms of Service
            </Button>
            <Button size="sm" onClick={() => navigate("/contact")}>
              Contact Us
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
