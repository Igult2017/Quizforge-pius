import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLocation } from "wouter";
import { ChevronDown, ChevronUp, HelpCircle, BookOpen, CreditCard, BarChart2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: React.ElementType;
  label: string;
  items: FAQItem[];
}

const FAQ_CATEGORIES: FAQCategory[] = [
  {
    icon: BookOpen,
    label: "About NurseBrace",
    items: [
      {
        question: "What is NurseBrace?",
        answer:
          "NurseBrace is an exam preparation platform built specifically for nursing students. We provide high-yield, exam-level practice questions with detailed rationales for ATI TEAS, HESI A2, and NCLEX — helping you pass on your first attempt.",
      },
      {
        question: "Which exams does NurseBrace cover?",
        answer:
          "NurseBrace currently covers ATI TEAS, HESI A2, and NCLEX. Each exam category includes hundreds of practice questions across all tested subject areas: Reading, Math, Science, English & Language Usage, and Anatomy & Physiology.",
      },
      {
        question: "How are the questions different from free practice tests?",
        answer:
          "Our questions are written to match the exact difficulty and style of real exams. Every question includes a detailed rationale explaining not just the correct answer but why the other options are wrong — so you understand the concept, not just memorize an answer.",
      },
      {
        question: "How many questions are in the question bank?",
        answer:
          "The NurseBrace question bank contains 1,000+ exam-level practice questions and is continuously updated. With an active subscription you get unlimited access to all of them.",
      },
    ],
  },
  {
    icon: CreditCard,
    label: "Plans & Billing",
    items: [
      {
        question: "Is there a free trial?",
        answer:
          "Yes! You can access 30 free practice questions — no credit card required. This gives you a real feel for the question quality and platform before committing to a paid plan.",
      },
      {
        question: "What plans are available?",
        answer:
          "We offer two paid plans: a Weekly Plan at $19.99/week (perfect for last-minute prep) and a Monthly Plan at $49.99/month (best value for full preparation). Both plans include unlimited practice sessions with 50 questions per session.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. There are no long-term contracts. You can cancel your subscription at any time directly from your account settings, and you will retain access until the end of your current billing period.",
      },
      {
        question: "Do you offer refunds?",
        answer:
          "Yes. We stand behind our platform with a money-back guarantee. If you're not satisfied, contact us at nursebracehelp@gmail.com and we'll make it right — no questions asked.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major debit and credit cards processed securely via Paystack. Your payment information is never stored on our servers.",
      },
    ],
  },
  {
    icon: BarChart2,
    label: "Using the Platform",
    items: [
      {
        question: "How does the adaptive quiz work?",
        answer:
          "NurseBrace tracks your performance across all topics and automatically surfaces questions from your weakest areas first — so your study time is always spent where it matters most.",
      },
      {
        question: "Can I review my past quiz results?",
        answer:
          "Yes. Your performance dashboard shows your score history, correct/incorrect breakdowns by topic, and progress trends over time — so you always know exactly where you stand.",
      },
      {
        question: "Is there a limit to how many quizzes I can take?",
        answer:
          "With a paid subscription, practice sessions are unlimited. Each session presents up to 50 questions. You can start a new session whenever you like.",
      },
      {
        question: "Can I use NurseBrace on my phone?",
        answer:
          "Absolutely. NurseBrace is fully responsive and works great on any device — phone, tablet, or desktop. No app download required; just open your browser and go.",
      },
    ],
  },
  {
    icon: ShieldCheck,
    label: "Account & Security",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Get Started' on the home page. You can sign up with your email address or use Google Sign-In for a one-click setup. No credit card is needed to create a free account.",
      },
      {
        question: "I forgot my password. How do I reset it?",
        answer:
          "On the login page, click 'Forgot password?' and enter your email address. You'll receive a password reset link within a few minutes. Check your spam folder if it doesn't arrive.",
      },
      {
        question: "Is my personal data safe?",
        answer:
          "Yes. We use industry-standard encryption and secure authentication (Firebase Auth) to protect your account. We never sell your personal data to third parties. See our Privacy Policy for full details.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach us at nursebracehelp@gmail.com or via WhatsApp at +1 979 304 2463. Our support team is available Monday–Friday 9 AM–8 PM EST and Saturday 10 AM–6 PM EST.",
      },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          <button
            onClick={() => toggle(i)}
            className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
          >
            <span className="font-600 text-gray-900 text-sm md:text-base font-semibold">
              {item.question}
            </span>
            {openIndex === i ? (
              <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5 pt-1 bg-white border-t border-gray-100">
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQ() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState(0);

  const current = FAQ_CATEGORIES[activeCategory];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white py-14 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5">
            <HelpCircle className="h-3.5 w-3.5" /> Help Center
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base md:text-lg opacity-90 font-medium">
            Everything you need to know about NurseBrace. Can't find your answer?{" "}
            <button
              onClick={() => navigate("/contact")}
              className="underline font-bold hover:opacity-80 transition-opacity"
            >
              Contact us.
            </button>
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Category tabs */}
        <div className="flex flex-wrap gap-3 mb-10 justify-center">
          {FAQ_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon;
            const isActive = activeCategory === i;
            return (
              <button
                key={i}
                onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-700 font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Active category */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <current.icon className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">
              {current.label}
            </h2>
          </div>
          <FAQAccordion items={current.items} />
        </div>

        {/* Still need help */}
        <div className="mt-16 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-extrabold text-gray-900 mb-3">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Our support team typically responds within a few hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate("/contact")} className="font-bold">
              Contact Support
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/signup")}
              className="font-bold"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
