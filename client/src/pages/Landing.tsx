import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, BookOpen, TrendingUp, Award, ArrowRight, Check } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Blue Background */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-4 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-700/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
              Pass Your Nursing Exams on the First Try
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-50">
              10,000+ NCLEX, ATI TEAS, and HESI A2 practice questions with instant feedback 
              and smart analytics to boost your scores.
            </p>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <Link href="/signup">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8" 
                  data-testid="button-start-trial"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 bg-transparent backdrop-blur-sm"
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 text-sm md:text-base">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span>30-question free trial</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice, Learn, and Pass Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Practice, Learn, and <span className="text-primary">Pass</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Master every nursing exam with targeted practice, detailed explanations, and 
            proven study strategies designed for your success.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Comprehensive Question Bank</CardTitle>
                <CardDescription>
                  Access practice questions across NCLEX, ATI TEAS, and HESI A2 categories
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Detailed Explanations</CardTitle>
                <CardDescription>
                  Learn from comprehensive explanations for each question to understand the concepts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Track Your Progress</CardTitle>
                <CardDescription>
                  Monitor your performance and identify areas that need improvement
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Pricing Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12">Simple, Affordable Pricing</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Free Trial</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2">$0</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>30 practice questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>All question categories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Detailed explanations</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <Badge className="mb-2 w-fit">Most Popular</Badge>
                  <CardTitle>Monthly Plan</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2">$15/month</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Unlimited practice sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>50 questions per session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>All features included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Plan</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2">$5/week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>Unlimited practice sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>50 questions per session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span>All features included</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
