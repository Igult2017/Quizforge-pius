import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, Award, Heart, GraduationCap, TrendingUp } from "lucide-react";
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

export default function About() {
  const [, setLocation] = useLocation();

  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To empower aspiring nurses and healthcare professionals with accessible, high-quality exam preparation resources that build confidence and ensure success.",
    },
    {
      icon: Users,
      title: "Student-Focused",
      description: "We put students first, designing our platform around their needs with intuitive interfaces, comprehensive explanations, and personalized learning paths.",
    },
    {
      icon: Award,
      title: "Quality Content",
      description: "Our question banks are carefully crafted to mirror real exam formats, ensuring you practice with the most relevant and accurate content available.",
    },
    {
      icon: Heart,
      title: "Supportive Community",
      description: "We believe in supporting every step of your journey with responsive customer service and a commitment to your success.",
    },
  ];

  const features = [
    {
      icon: GraduationCap,
      title: "21,000+ Practice Questions",
      description: "Comprehensive coverage across NCLEX, ATI TEAS, and HESI A2 exams",
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "Track your progress and identify areas for improvement",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              About NurseBrace
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Empowering the next generation of healthcare professionals through comprehensive exam preparation
            </p>
          </div>

          <div className="mb-16">
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-2xl">Who We Are</CardTitle>
              </CardHeader>
              <CardContent className="text-lg space-y-4">
                <p>
                  NurseBrace is a dedicated platform built for nursing students and aspiring healthcare professionals. 
                  We understand the challenges of preparing for major nursing exams like NCLEX, ATI TEAS, and HESI A2, 
                  and we're here to make that journey easier and more effective.
                </p>
                <p>
                  Our platform combines cutting-edge AI technology with carefully curated content to deliver a 
                  personalized learning experience that adapts to your needs. Whether you're taking your first practice 
                  test or fine-tuning your skills before the big exam, NurseBrace provides the tools and support you need 
                  to succeed.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="hover-elevate transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle>{value.title}</CardTitle>
                    </div>
                    <CardDescription className="text-base">{value.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">What We Offer</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border-l-4 border-l-primary hover-elevate transition-all">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center bg-card border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Join Thousands of Successful Students</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start your journey to exam success today with 5 free questions per exam category.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button 
                size="lg" 
                onClick={() => setLocation("/categories")}
                data-testid="button-get-started"
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => setLocation("/contact")}
                data-testid="button-contact-us"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
