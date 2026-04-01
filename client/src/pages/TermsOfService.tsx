import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FileText } from "lucide-react";

const LAST_UPDATED = "January 1, 2026";

interface Section {
  title: string;
  content: (string | { heading: string; text: string })[];
}

const SECTIONS: Section[] = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "By accessing or using NurseBrace (the 'Service'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, you may not use the Service.",
      "These Terms apply to all visitors, registered users, and subscribers. We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.",
    ],
  },
  {
    title: "2. Eligibility",
    content: [
      "You must be at least 16 years old to use NurseBrace. By creating an account, you confirm that you are at least 16 years of age and have the legal capacity to enter into a binding agreement.",
      "If you are using the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these Terms.",
    ],
  },
  {
    title: "3. Accounts",
    content: [
      {
        heading: "Registration",
        text: "To access most features of the Service, you must create an account by providing accurate and complete information. You are responsible for keeping your login credentials secure.",
      },
      {
        heading: "Account Responsibility",
        text: "You are responsible for all activity that occurs under your account. If you believe your account has been compromised, notify us immediately at nursebracehelp@gmail.com.",
      },
      {
        heading: "One account per person",
        text: "Each account is for a single individual. You may not share your account credentials with others or allow others to access the Service through your account.",
      },
    ],
  },
  {
    title: "4. Subscriptions and Payments",
    content: [
      {
        heading: "Free Trial",
        text: "We offer a free trial that provides access to a limited number of practice questions. No credit card is required to start a free trial. Free trial usage is limited to one per person; creating duplicate accounts to obtain additional free trials is prohibited.",
      },
      {
        heading: "Paid Plans",
        text: "We offer Weekly ($19.99/week) and Monthly ($49.99/month) subscription plans. Subscriptions are billed in advance on a recurring basis. Your subscription renews automatically at the end of each billing period unless cancelled.",
      },
      {
        heading: "Cancellation",
        text: "You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period; you will retain access to paid features until that date. We do not prorate partial periods.",
      },
      {
        heading: "Refunds",
        text: "If you are not satisfied with the Service, contact us at nursebracehelp@gmail.com within your billing period. We assess refund requests on a case-by-case basis and honour our money-back guarantee for genuine cases of dissatisfaction.",
      },
      {
        heading: "Price Changes",
        text: "We reserve the right to change subscription pricing. We will provide at least 14 days' notice before a price change takes effect for existing subscribers, giving you time to cancel if you do not agree.",
      },
    ],
  },
  {
    title: "5. Permitted Use",
    content: [
      "You may use the Service only for lawful, personal, non-commercial study purposes. You agree not to:",
      {
        heading: "Reproduce or distribute content",
        text: "Copy, reproduce, republish, upload, post, transmit, or distribute any practice questions, rationales, or other content from the Service without our prior written consent.",
      },
      {
        heading: "Reverse engineer",
        text: "Attempt to reverse engineer, decompile, disassemble, or discover the source code of the Service or its underlying systems.",
      },
      {
        heading: "Misuse the platform",
        text: "Use automated tools, bots, scrapers, or scripts to access or extract data from the Service; attempt to circumvent any access restrictions; or interfere with the security or integrity of the Service.",
      },
      {
        heading: "Misrepresent",
        text: "Impersonate any person or entity, or misrepresent your affiliation with any person or entity.",
      },
      {
        heading: "Violate laws",
        text: "Use the Service for any unlawful purpose or in violation of any applicable local, state, national, or international law or regulation.",
      },
    ],
  },
  {
    title: "6. Intellectual Property",
    content: [
      "All content on the Service — including practice questions, rationales, explanations, graphics, logos, and software — is the property of NurseBrace or its licensors and is protected by applicable intellectual property laws.",
      "We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use the Service for your personal study purposes, subject to these Terms.",
      "Nothing in these Terms transfers any intellectual property rights to you. You may not use our name, logo, or branding without our prior written consent.",
    ],
  },
  {
    title: "7. Educational Disclaimer",
    content: [
      "NurseBrace is an educational tool designed to help students prepare for nursing entrance and licensure exams. It is not a substitute for accredited nursing education, official study materials published by exam bodies, or professional medical advice.",
      "We make no guarantee that use of the Service will result in a passing score on any exam. Exam formats and content are subject to change by the respective testing organisations (ATI, HESI, NCSBN), and we are not affiliated with or endorsed by any of them.",
    ],
  },
  {
    title: "8. Disclaimers and Limitation of Liability",
    content: [
      {
        heading: "Provided 'as is'",
        text: "The Service is provided on an 'as is' and 'as available' basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
      },
      {
        heading: "No uptime guarantee",
        text: "We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.",
      },
      {
        heading: "Limitation of liability",
        text: "To the fullest extent permitted by law, NurseBrace and its directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability to you for any claim arising out of these Terms shall not exceed the amount you paid us in the 3 months preceding the claim.",
      },
    ],
  },
  {
    title: "9. Termination",
    content: [
      "We reserve the right to suspend or terminate your account at our discretion, with or without notice, if you violate these Terms or engage in behaviour that we determine is harmful to other users or the Service.",
      "You may delete your account at any time by contacting nursebracehelp@gmail.com. Upon termination, your right to use the Service ceases immediately and we may delete your account data in accordance with our Privacy Policy.",
    ],
  },
  {
    title: "10. Governing Law",
    content: [
      "These Terms are governed by and construed in accordance with the laws of the State of Texas, United States, without regard to conflict of law principles.",
      "Any disputes arising under these Terms shall be resolved first through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration in accordance with the rules of the American Arbitration Association.",
    ],
  },
  {
    title: "11. Changes to These Terms",
    content: [
      "We may update these Terms at any time. When we make material changes, we will notify you by email and/or by posting a prominent notice on the Service at least 14 days before the changes take effect.",
      "Your continued use of the Service after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree, you must stop using the Service.",
    ],
  },
  {
    title: "12. Contact Us",
    content: [
      "If you have questions about these Terms, please contact us:",
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

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5">
            <FileText className="h-3.5 w-3.5" /> Legal
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Terms of Service
          </h1>
          <p className="text-sm md:text-base opacity-80 font-medium">
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10 text-sm text-blue-800 leading-relaxed">
          <strong>Summary:</strong> Use NurseBrace for personal study only. Don't share your account or copy our content. Subscriptions renew automatically and can be cancelled at any time. We offer a money-back guarantee for genuine dissatisfaction.
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

      </main>

      <Footer />
    </div>
  );
}
