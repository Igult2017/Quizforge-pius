import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@assets/generated_images/Nursing_student_studying_hero_image_0c0f7ccf.png";

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-800/80" />
      </div>

      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Pass Your Nursing Exams on the First Try
          </h1>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            10,000+ NCLEX, ATI TEAS, and HESI A2 practice questions with instant
            feedback and smart analytics to boost your scores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-white text-blue-900 hover:bg-blue-50 text-lg px-8"
              onClick={onGetStarted}
              data-testid="button-hero-getstarted"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-sm text-lg px-8"
              data-testid="button-hero-learn"
            >
              Learn More
            </Button>
          </div>
          <div className="flex items-center gap-6 mt-8 text-white/90 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">✓</span>
              <span>3-day free trial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
