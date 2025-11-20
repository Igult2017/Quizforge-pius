import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, BookOpen, Brain, Stethoscope } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Twitter, Facebook, Instagram } from "lucide-react";

const Footer = () => {
  const headerClasses = "font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2 text-base font-poppins";

  return (
    <footer className="bg-gray-100 text-gray-900 pt-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12">
          
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-3xl font-extrabold mb-4 text-blue-600 font-poppins">NurseBrace</h3>
            <p className="text-sm text-gray-700 max-w-xs leading-relaxed font-poppins">
              Empowering healthcare professionals.
            </p>
          </div>

          <div>
            <h4 className={headerClasses}>Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/exams" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Exams</Link></li>
              <li><Link href="/pricing" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headerClasses}>Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">About Us</Link></li>
              <li><Link href="/contact" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={headerClasses}>Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><span className="text-blue-600 font-poppins">FAQ</span></li>
            </ul>
          </div>

          <div>
            <h4 className={headerClasses}>Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><span className="text-blue-600 font-poppins">Privacy Policy</span></li>
              <li><span className="text-blue-600 font-poppins">Terms of Service</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-gray-200 py-6 md:flex md:items-center md:justify-between">
          <p className="text-sm text-gray-600 text-center md:text-left mb-4 md:mb-0 font-poppins">
            © {new Date().getFullYear()} NurseBrace. All rights reserved.
          </p>

          <div className="flex justify-center md:justify-end space-x-6">
            <a href="#" aria-label="Twitter" className="text-gray-600 hover:text-blue-600 transition">
              <Twitter className="h-5 w-5 md:h-6 md:w-6" />
            </a>
            <a href="#" aria-label="Facebook" className="text-gray-600 hover:text-blue-600 transition">
              <Facebook className="h-5 w-5 md:h-6 md:w-6" />
            </a>
            <a href="#" aria-label="Instagram" className="text-gray-600 hover:text-blue-600 transition">
              <Instagram className="h-5 w-5 md:h-6 md:w-6" />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default function Exams() {
  const [, setLocation] = useLocation();

  const exams = [
    {
      title: "NCLEX-RN & NCLEX-PN",
      icon: Stethoscope,
      description: "National Council Licensure Examination for Registered Nurses and Practical Nurses",
      color: "purple",
      questionCount: "5,000+ Questions",
      details: [
        "Comprehensive RN and PN question banks",
        "Covers all NCLEX categories and client needs",
        "Management of Care, Safety and Infection Control",
        "Health Promotion and Maintenance",
        "Psychosocial Integrity",
        "Physiological Integrity",
        "Pharmacological and Parenteral Therapies",
        "Reduction of Risk Potential",
      ],
      badge: "Most Popular",
    },
    {
      title: "ATI TEAS",
      icon: BookOpen,
      description: "Test of Essential Academic Skills for Nursing School Entrance",
      color: "orange",
      questionCount: "2,500+ Questions",
      details: [
        "Reading: Key ideas, craft and structure, integration of knowledge",
        "Mathematics: Numbers and algebra, measurement and data",
        "Science: Human anatomy and physiology, biology, chemistry",
        "English and Language Usage: Conventions, knowledge of language, vocabulary",
        "Comprehensive practice tests",
        "Aligned with ATI TEAS Version 7",
      ],
      badge: "Updated",
    },
    {
      title: "HESI A2",
      icon: Brain,
      description: "Health Education Systems Incorporated Admission Assessment",
      color: "teal",
      questionCount: "1,500+ Questions",
      details: [
        "Mathematics: Basic calculations, algebra, fractions, decimals",
        "Reading Comprehension: Main ideas, supporting details, inferences",
        "Vocabulary and General Knowledge",
        "Grammar: Parts of speech, sentence structure",
        "Biology: Cellular processes, genetics, photosynthesis",
        "Chemistry: Atomic structure, chemical reactions, periodic table",
        "Anatomy and Physiology: Body systems and functions",
      ],
      badge: "Comprehensive",
    },
  ];

  const colorClasses = {
    purple: "border-purple-500 bg-purple-50 dark:bg-purple-950/20",
    orange: "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
    teal: "border-teal-500 bg-teal-50 dark:bg-teal-950/20",
  };

  const iconColorClasses = {
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
    teal: "text-teal-600 dark:text-teal-400",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Exams We Offer
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive practice questions for major nursing exams. Master your exam with our extensive question banks.
            </p>
          </div>

          <div className="space-y-8">
            {exams.map((exam, index) => (
              <Card 
                key={index} 
                className={`border-l-4 ${colorClasses[exam.color]} hover-elevate transition-all`}
                data-testid={`card-exam-${exam.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-background ${iconColorClasses[exam.color]}`}>
                        <exam.icon className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <CardTitle className="text-2xl">{exam.title}</CardTitle>
                          {exam.badge && (
                            <Badge variant="secondary">{exam.badge}</Badge>
                          )}
                        </div>
                        <CardDescription className="text-base">{exam.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm font-mono">
                      {exam.questionCount}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {exam.details.map((detail, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center bg-card border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Start Practicing?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Get access to all exam categories with 50 free questions per exam. Subscribe for unlimited practice.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => setLocation("/categories")}
                data-testid="button-start-free-trial"
              >
                Start Free Trial
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setLocation("/pricing")}
                data-testid="button-view-pricing"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
