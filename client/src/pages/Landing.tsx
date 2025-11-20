import React, { useState, useCallback, useMemo } from 'react';
import { 
  CheckCircle2, BookOpen, TrendingUp, Award,
  ArrowRight, Check, Users, Star, Clock, 
  Twitter, Facebook, Instagram, Menu, X,
  LayoutGrid
} from "lucide-react";
import { Link, useLocation } from "wouter";
import nurseImage1 from "@assets/generated_images/Professional_Nurse_Portrait_c25f7b05.png";
import nurseImage2 from "@assets/generated_images/Nursing_Professional_Portrait_72f6c6ff.png";
import nurseImage3 from "@assets/generated_images/Healthcare_Student_Studying_944b5e0c.png";
import { SEO } from "@/components/SEO";
import { pageSEO, organizationSchema, productSchema, faqSchema } from "@/lib/seo-data";

// =================================================================
// CUSTOM ICON COMPONENT (Based on User's Gear/Process Image)
// =================================================================

/**
 * Custom icon combining a gear (process) and checkmark (completion) 
 * with two-tone blue colors to match the user's requested image.
 */
const CustomProcessIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    // Use currentColor (which will be blue-600) for the main gear color
    stroke="currentColor" 
    strokeWidth="1.5" 
    className={className}
  >
    {/* Outer Arrows (Light Blue: #60a5fa / Blue-400) - Simulating the cycle/process */}
    <path 
      d="M21 12A9 9 0 0 0 12 3v1a8 8 0 0 1 8 8h1zM3 12a9 9 0 0 0 9 9v-1a8 8 0 0 1-8-8H3z" 
      stroke="#60a5fa" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    {/* Arrowheads for the cycle */}
    <polyline points="21 15 21 12 18 12" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="3 9 3 12 6 12" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    
    {/* Inner Gear (Dark Blue: currentColor / Blue-600) */}
    <path 
      d="M12.22 2h-.44a2 2 0 0 0-2 2v.44a2 2 0 0 1-1.22 1.66l-.54.21a2 2 0 0 0-2.2-.42l-.55-.26a2 2 0 0 0-2.2 1.4L2.09 9.3a2 2 0 0 0 .88 2.3L4 12l-1.03 1.39a2 2 0 0 0-.88 2.3l.55 1.13a2 2 0 0 0 2.2 1.4l.55-.26a2 2 0 0 1 2.2-.42l.54.21a2 2 0 0 0 1.22 1.66V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.44a2 2 0 0 1 1.22-1.66l-.54-.21a2 2 0 0 0 2.2.42l.55.26a2 2 0 0 0 2.2-1.4L21.91 14.7a2 2 0 0 0-.88-2.3L20 12l1.03-1.39a2 2 0 0 0 .88-2.3l-.55-1.13a2 2 0 0 0-2.2-1.4l-.55.26a2 2 0 0 1-2.2.42l-.54-.21a2 2 0 0 0-1.22-1.66V4a2 2 0 0 0-2-2z" 
      fill="currentColor"
      stroke="none"
    />
    
    {/* Inner Checkmark (Light Blue: #60a5fa / Blue-400) */}
    <polyline points="8 12 11 15 15 9" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);


// =================================================================
// 1. MOCK UTILITIES & SHADCN COMPONENTS (Simplified for display)
// =================================================================

// --- MOCK SHADCN UI COMPONENTS ---

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  let variantClasses = "bg-blue-600 text-white hover:bg-blue-700 shadow-md";
  if (variant === "outline") {
    variantClasses = "border border-input bg-background hover:bg-gray-100 hover:text-accent-foreground";
  }
  
  let sizeClasses = "h-10 px-4 py-2";
  if (size === "lg") {
    sizeClasses = "h-12 px-8 text-lg";
  }

  const classes = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`;
  
  if (asChild) {
    return React.createElement(props.children.type, { ...props, ref, className: classes });
  }

  return <button className={classes} ref={ref} {...props} />;
});
Button.displayName = "Button";

const Card = ({ className, ...props }) => (
  <div className={`rounded-xl border bg-card text-card-foreground shadow-sm ${className}`} {...props} />
);

const CardHeader = ({ className, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

const CardTitle = ({ className, ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props} />
);

const CardDescription = ({ className, ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props} />
);

const CardContent = ({ className, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

const CardFooter = ({ className, ...props }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);

const Badge = ({ className, variant, ...props }) => {
  let variantClasses = "bg-gray-100 text-gray-800 hover:bg-gray-200";
  if (variant === "default" || !variant) {
    variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
  }
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${variantClasses} ${className}`} {...props} />
  );
};

// --- MOCK HOOKS (not used, actual hook is imported) ---
// const useUserData = () => {
//   return {
//     isAuthenticated: false,
//     hasActiveSubscription: false,
//     allFreeTrialsUsed: false,
//     subscription: null,
//   };
// };

// --- MOCK HEADER COMPONENT ---
const Header = ({ onSignIn, onGetStarted }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "Exams", href: "/exams" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "About", href: "/about" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand - Fixed: Passes styles directly to Link */}
          <Link href="/" className="text-2xl font-bold text-blue-700 hover:text-blue-800 transition duration-150 font-poppins">
            NurseBrace
          </Link>

          {/* Desktop Navigation - Fixed: Passes styles directly to Link */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="text-gray-600 hover:text-blue-600 font-medium transition duration-150 font-poppins"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" onClick={onSignIn} className="text-gray-600 hover:bg-gray-100 font-poppins">
              Sign In
            </Button>
            <Button onClick={onGetStarted} className="bg-blue-600 hover:bg-blue-700 font-poppins">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-gray-600 hover:text-blue-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-xl absolute w-full z-40 pb-4 border-t border-gray-100">
          <nav className="flex flex-col space-y-2 px-4 pt-2">
            {navItems.map((item) => (
              <Link 
                key={item.name} 
                href={item.href} 
                className="block py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition duration-150 font-poppins"
                onClick={() => setIsMenuOpen(false)} 
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col space-y-3 px-4 mt-4">
            <Button onClick={() => { onSignIn(); setIsMenuOpen(false); }} variant="outline" className="w-full font-poppins">
              Sign In
            </Button>
            <Button onClick={() => { onGetStarted(); setIsMenuOpen(false); }} className="w-full bg-blue-600 hover:bg-blue-700 font-poppins">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

// =================================================================
// 2. MAIN LANDING PAGE LOGIC & DISPLAY
// =================================================================

/**
 * Footer Component - Light grey background, blue & black text.
 */
const Footer = ({ isAuthenticated, handleFreeTrial }) => {
  // Updated classes for new color scheme
  const headerClasses = "font-semibold text-gray-900 mb-4 border-b border-gray-300 pb-2 text-base font-poppins";

  return (
    <footer className="bg-gray-100 text-gray-900 pt-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 py-12">
          
          {/* 1. Brand/Mission */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-3xl font-extrabold mb-4 text-blue-600 font-poppins">NurseBrace</h3>
            <p className="text-sm text-gray-700 max-w-xs leading-relaxed font-poppins">
              Empowering healthcare professionals.
            </p>
          </div>

          {/* 2. Product Links */}
          <div>
            <h4 className={headerClasses}>Product</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/exams" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Exams</Link></li>
              <li><Link href="/pricing" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Pricing</Link></li>
            </ul>
          </div>

          {/* 3. Company Links */}
          <div>
            <h4 className={headerClasses}>Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/about" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">About Us</Link></li>
              <li><Link href="/contact" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Contact</Link></li>
            </ul>
          </div>

          {/* 4. Resources Links */}
          <div>
            <h4 className={headerClasses}>Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/faq" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">FAQ</Link></li>
            </ul>
          </div>

          {/* 5. Legal Links */}
          <div>
            <h4 className={headerClasses}>Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="/privacy" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-blue-600 hover:text-blue-800 transition duration-150 font-poppins">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar (Social Icons and Copyright) */}
        <div className="border-t-2 border-gray-200 py-6 md:flex md:items-center md:justify-between">
          
          {/* Copyright */}
          <p className="text-sm text-gray-600 text-center md:text-left mb-4 md:mb-0 font-poppins">
            © {new Date().getFullYear()} NurseBrace. All rights reserved.
          </p>

          {/* Social Icons */}
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


export default function Landing() {
  const [, setLocation] = useLocation();

  const {
    isAuthenticated, hasActiveSubscription, allFreeTrialsUsed, subscription
  } = useUserData();

  const handleFreeTrial = useCallback(() => {
    // Navigates to practice categories if authenticated, otherwise forces sign up.
    if (isAuthenticated) {
      setLocation("/categories");
    } else {
      setLocation("/signup");
    }
  }, [isAuthenticated, setLocation]);

  const handlePaidPlan = useCallback((plan) => {
    if (isAuthenticated && hasActiveSubscription) {
      setLocation("/categories");
    } else {
      setLocation(`/checkout?plan=${plan.toLowerCase()}`);
    }
  }, [isAuthenticated, hasActiveSubscription, setLocation]);

  const getButtonText = useCallback((planType, planName) => {
    if (!isAuthenticated) {
      return planType === "free" ? "Start Free Trial" : "Subscribe";
    }
    
    if (hasActiveSubscription) {
      const isCurrentPlan = subscription?.plan === planName.toLowerCase();
      return isCurrentPlan ? "Current Plan" : "Go to Practice";
    }
    
    if (allFreeTrialsUsed && planType === "free") {
      return "Trial Used";
    }
    
    return planType === "free" ? "Start Practice" : "Subscribe";
  }, [isAuthenticated, hasActiveSubscription, allFreeTrialsUsed, subscription]);

  const isButtonDisabled = useCallback((planType, planName) => {
    if (!isAuthenticated) return false;
    
    if (hasActiveSubscription) {
      return subscription?.plan === planName.toLowerCase();
    }
    
    if (allFreeTrialsUsed && planType === "free") {
      return true;
    }
    
    return false;
  }, [isAuthenticated, hasActiveSubscription, allFreeTrialsUsed, subscription]);

  // Combined structured data for the landing page
  const landingStructuredData = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema,
      productSchema,
      faqSchema
    ]
  };

  return (
    <>
      <SEO
        title={pageSEO.home.title}
        description={pageSEO.home.description}
        keywords={pageSEO.home.keywords}
        structuredData={landingStructuredData}
        canonicalUrl="https://www.nursebrace.com"
      />
      <div className="min-h-screen bg-background font-sans" style={{ fontFamily: 'Poppins, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap');
          .font-poppins {
            font-family: 'Poppins', sans-serif !important;
          }

        /* Custom Styled Button from User Image */
        .styled-button {
            position: relative;
            z-index: 10;
            background-color: #3b82f6; /* Blue-500 */
            color: white;
            padding: 1rem 2rem;
            border-radius: 9999px; /* Fully rounded */
            font-weight: 700; /* Bold */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
            overflow: visible; /* Allows pseudo-elements to extend outside */
        }
        
        .styled-button:hover {
            background-color: #2563eb; /* Blue-600 */
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
        }

        /* Inner Blue Line Border */
        .styled-button::before {
            content: '';
            position: absolute;
            top: -3px;
            left: -3px;
            right: -3px;
            bottom: -3px;
            border: 2px solid #3b82f6; /* Matching blue */
            border-radius: 9999px;
            z-index: -1;
        }

        /* Outer Dashed Border */
        .styled-button::after {
            content: '';
            position: absolute;
            top: -8px;
            left: -8px;
            right: -8px;
            bottom: -8px;
            border: 2px dashed black;
            border-radius: 9999px;
            z-index: -2;
        }

        /* Dots on top of the button */
        .styled-button-dot {
            position: absolute;
            width: 6px;
            height: 6px;
            background-color: black;
            border-radius: 50%;
            top: 0;
            z-index: 20;
            transform: translateY(-8px); /* Move above the blue button */
        }
        .styled-button .dot-1 { left: 30%; }
        .styled-button .dot-2 { left: 50%; }
        .styled-button .dot-3 { left: 70%; }

        /* Circles on the side of the button */
        .styled-button-circle {
            position: absolute;
            width: 8px;
            height: 8px;
            border: 2px solid black;
            background-color: white;
            border-radius: 50%;
            top: 50%;
            transform: translateY(-50%);
            z-index: 20;
        }
        .styled-button .circle-left { left: -10px; }
        .styled-button .circle-right { right: -10px; }


      `}} />
      <Header 
        onSignIn={() => setLocation("/login")}
        onGetStarted={() => setLocation("/signup")}
      />
      {/* Hero Section with Blue Background and Images */}
      <section style={{ backgroundColor: '#1e40af' }} className="py-16 md:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left Column - Text Content */}
            <div className="text-white">
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 font-poppins"
                data-testid="text-hero-title"
              >
                Pass Your Nursing Exams on the First Try
              </h1>
              <p className="text-lg font-semibold opacity-90 mb-10 max-w-lg font-poppins">
                10,000+ NCLEX, ATI TEAS, and HESI A2 practice questions with instant feedback 
                and smart analytics to boost your score.
              </p>
              
              <div className="flex flex-col sm:flex-row space-y-8 sm:space-y-0 sm:space-x-8 mb-10">
                
                {/* START FREE TRIAL Button (Custom Style) */}
                <Link href="/signup">
                  <button className="styled-button flex items-center justify-center min-w-[200px] font-poppins text-lg">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                    {/* Unique Stylistic Elements */}
                    <span className="styled-button-dot dot-1"></span>
                    <span className="styled-button-dot dot-2"></span>
                    <span className="styled-button-dot dot-3"></span>
                    <span className="styled-button-circle circle-left"></span>
                    <span className="styled-button-circle circle-right"></span>
                  </button>
                </Link>

                {/* LEARN MORE Button (Custom Style) - Slightly different text/color for contrast */}
                <Link href="/pricing">
                  <button className="styled-button flex items-center justify-center min-w-[200px] font-poppins text-lg"
                    style={{ backgroundColor: '#ffffff', color: '#1e40af' }} // White fill, Dark blue text
                  >
                    Learn More
                    {/* Unique Stylistic Elements - Using inverted colors for dots/circles */}
                    <span className="styled-button-dot dot-1" style={{ backgroundColor: '#1e40af' }}></span>
                    <span className="styled-button-dot dot-2" style={{ backgroundColor: '#1e40af' }}></span>
                    <span className="styled-button-dot dot-3" style={{ backgroundColor: '#1e40af' }}></span>
                    <span className="styled-button-circle circle-left" style={{ border: '2px solid #1e40af' }}></span>
                    <span className="styled-button-circle circle-right" style={{ border: '2px solid #1e40af' }}></span>
                  </button>
                </Link>
              </div>

              <div className="space-y-3 font-poppins">
                <div className="flex items-center text-sm font-medium opacity-80">
                  <Check className="w-5 h-5 text-green-300 mr-2" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center text-sm font-medium opacity-80">
                  <Check className="w-5 h-5 text-green-300 mr-2" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center text-sm font-medium opacity-80">
                  <Check className="w-5 h-5 text-green-300 mr-2" />
                  <span>30-question free trial</span>
                </div>
              </div>
            </div>

            {/* Right Column - Nursing Images */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img 
                  src={nurseImage1} 
                  alt="Professional nurse in healthcare setting" 
                  className="rounded-xl shadow-2xl w-full h-64 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/1e40af/ffffff?text=Nurse+1"; }}
                />
                <img 
                  src={nurseImage2} 
                  alt="Nursing professional" 
                  className="rounded-xl shadow-2xl w-full h-48 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/1e40af/ffffff?text=Nurse+2"; }}
                />
              </div>
              <div className="pt-8">
                <img 
                  src={nurseImage3} 
                  alt="Healthcare professional studying" 
                  className="rounded-xl shadow-2xl w-full h-80 object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/400x400/1e40af/ffffff?text=Nurse+3"; }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Practice, Learn, and Pass Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-poppins">
            Practice, Learn, and <span className="text-blue-600">Pass</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto font-poppins">
            Master every nursing exam with targeted practice, detailed explanations, and 
            proven study strategies designed for your success.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                {/* NEW ICON: Custom icon matching the user's requested gear/process image */}
                <CustomProcessIcon className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="font-poppins">Comprehensive Question Bank</CardTitle>
                <CardDescription className="font-poppins">
                  Access practice questions across NCLEX, ATI TEAS, and HESI A2 categories
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                <BookOpen className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="font-poppins">Detailed Explanations</CardTitle>
                <CardDescription className="font-poppins">
                  Learn from comprehensive explanations for each question to understand the concepts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="rounded-xl shadow-lg hover:shadow-xl transition duration-300">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle className="font-poppins">Track Your Progress</CardTitle>
                <CardDescription className="font-poppins">
                  Monitor your performance and identify areas that need improvement
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Pricing Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12 font-poppins">Simple, Affordable Pricing</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="rounded-xl shadow-lg">
                <CardHeader>
                  <CardTitle className="font-poppins">Free Trial</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2 font-poppins">$0</CardDescription>
                </CardHeader>
                <CardContent className="font-poppins">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>30 practice questions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>All question categories</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Detailed explanations</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-poppins"
                    onClick={handleFreeTrial}
                    disabled={isButtonDisabled("free", "free")}
                    data-testid="button-landing-free-trial"
                  >
                    {getButtonText("free", "free")}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-blue-600 border-2 rounded-xl shadow-2xl scale-[1.03]">
                <CardHeader>
                  <Badge className="mb-2 w-fit bg-blue-600 hover:bg-blue-700 font-poppins">
                    {hasActiveSubscription && subscription?.plan === "monthly" ? "Current Plan" : "Most Popular"}
                  </Badge>
                  <CardTitle className="font-poppins">Monthly Plan</CardTitle>
                  <CardDescription className="text-2xl font-bold mt-2 font-poppins">$15/month</CardDescription>
                </CardHeader>
                <CardContent className="font-poppins">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Unlimited practice sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>50 questions per session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>All features included</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 font-poppins"
                    onClick={() => handlePaidPlan("Monthly")}
                    disabled={isButtonDisabled("paid", "monthly")}
                    data-testid="button-landing-monthly"
                  >
                    {getButtonText("paid", "Monthly")}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="rounded-xl shadow-lg">
                <CardHeader>
                  {hasActiveSubscription && subscription?.plan === "weekly" && (
                    <Badge className="mb-2 w-fit bg-blue-600 hover:bg-blue-700 font-poppins">Current Plan</Badge>
                  )}
                  <CardTitle className="font-poppins">Weekly Plan</CardTitle>
                  {/* The previous error was here. CardDescription should be closed before CardHeader */}
                  <CardDescription className="text-2xl font-bold mt-2 font-poppins">$5/week</CardDescription>
                </CardHeader> {/* <-- FIXED: Changed </CardDescription> to </CardHeader> */}
                <CardContent className="font-poppins">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>Unlimited practice sessions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>50 questions per session</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>All features included</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 font-poppins"
                    onClick={() => handlePaidPlan("Weekly")}
                    disabled={isButtonDisabled("paid", "weekly")}
                    data-testid="button-landing-weekly"
                  >
                    {getButtonText("paid", "Weekly")}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose NurseBrace Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-poppins">
              Why Choose <span className="text-blue-600">NurseBrace</span>
            </h2>
            <p className="text-xl text-gray-600 font-poppins">
              Everything you need to pass your nursing exams, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Pass Rate Card */}
            <Card className="text-center rounded-xl shadow-md">
              <CardContent className="pt-6 font-poppins">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Pass Rate</p>
                <p className="text-4xl font-bold mb-1">95%</p>
                <p className="text-sm text-gray-500">Students improved scores</p>
              </CardContent>
            </Card>

            {/* Students Helped Card */}
            <Card className="text-center rounded-xl shadow-md">
              <CardContent className="pt-6 font-poppins">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Students Helped</p>
                <p className="text-4xl font-bold mb-1">10,000+</p>
                <p className="text-sm text-gray-500">Across the country</p>
              </CardContent>
            </Card>

            {/* Student Rating Card */}
            <Card className="text-center rounded-xl shadow-md">
              <CardContent className="pt-6 font-poppins">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Star className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Student Rating</p>
                <p className="text-4xl font-bold mb-1">4.9/5</p>
                <p className="text-sm text-gray-500">Based on reviews</p>
              </CardContent>
            </Card>

            {/* Free Trial Card */}
            <Card className="text-center rounded-xl shadow-md">
              <CardContent className="pt-6 font-poppins">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Free Trial</p>
                <p className="text-4xl font-bold mb-1">3 Days</p>
                <p className="text-sm text-gray-500">No credit card needed</p>
              </CardContent>
            </Card>
          </div>

          {/* Flexible Pricing Description */}
          <div className="text-center max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-4 font-poppins">
              Flexible Pricing for Every <span className="text-blue-600">Nursing Student</span>
            </h3>
            <p className="text-lg text-gray-600 font-poppins">
              One subscription gives you access to all exams: NCLEX-RN, NCLEX-PN, ATI TEAS, 
              HESI A2, and all nursing question banks. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* Finalized Footer Component */}
      <Footer isAuthenticated={isAuthenticated} handleFreeTrial={handleFreeTrial} />
    </div>
    </>
  );
}
