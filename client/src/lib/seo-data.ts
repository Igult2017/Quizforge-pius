// SEO content and structured data for NurseBrace

// Organization structured data
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "NurseBrace",
  "alternateName": ["Nurse Brace", "NurseBrace.com"],
  "url": "https://www.nursebrace.com",
  "logo": "https://www.nursebrace.com/logo.png",
  "description": "Comprehensive nursing exam preparation platform offering 10,000+ practice questions for NCLEX, ATI TEAS, and HESI A2 exams with instant feedback and detailed explanations.",
  "sameAs": [
    "https://www.facebook.com/nursebrace",
    "https://twitter.com/nursebrace",
    "https://www.instagram.com/nursebrace"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@nursebrace.com"
  }
};

// Product/Service structured data
export const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "NurseBrace Exam Preparation",
  "description": "Online nursing exam preparation with 10,000+ practice questions for NCLEX-RN, NCLEX-PN, ATI TEAS, and HESI A2",
  "brand": {
    "@type": "Brand",
    "name": "NurseBrace"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Weekly Plan",
      "price": "5.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.nursebrace.com/pricing",
      "priceValidUntil": "2025-12-31"
    },
    {
      "@type": "Offer",
      "name": "Monthly Plan",
      "price": "15.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://www.nursebrace.com/pricing",
      "priceValidUntil": "2025-12-31"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "150"
  }
};

// FAQ structured data
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is NurseBrace?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NurseBrace is a comprehensive online platform for nursing students preparing for major nursing exams including NCLEX-RN, NCLEX-PN, ATI TEAS, and HESI A2. We offer over 10,000 practice questions with instant feedback and detailed explanations."
      }
    },
    {
      "@type": "Question",
      "name": "How many practice questions does NurseBrace offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NurseBrace provides over 10,000 practice questions covering all major nursing exams: NCLEX-RN, NCLEX-PN, ATI TEAS, and HESI A2. Our question bank is continuously updated with new content."
      }
    },
    {
      "@type": "Question",
      "name": "Which nursing exams does NurseBrace support?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NurseBrace supports all major nursing exams including NCLEX-RN (National Council Licensure Examination for Registered Nurses), NCLEX-PN (for Practical Nurses), ATI TEAS (Test of Essential Academic Skills), and HESI A2 (Health Education Systems, Inc. Admission Assessment)."
      }
    },
    {
      "@type": "Question",
      "name": "How much does NurseBrace cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "NurseBrace offers flexible pricing: a free trial with 30 practice questions, a weekly plan at $5, and a monthly plan at $15. All plans include unlimited practice sessions, detailed explanations, and progress tracking across all exam categories."
      }
    },
    {
      "@type": "Question",
      "name": "Can I try NurseBrace before subscribing?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! NurseBrace offers a free trial with 30 practice questions so you can experience our platform before subscribing. No credit card required for the free trial."
      }
    }
  ]
};

// Educational course structured data for NCLEX
export const nclexCourseSchema = {
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "NCLEX-RN Practice Questions and Test Preparation",
  "description": "Comprehensive NCLEX-RN exam preparation with thousands of practice questions, detailed rationales, and progress tracking.",
  "provider": {
    "@type": "Organization",
    "name": "NurseBrace"
  },
  "educationalLevel": "Professional",
  "coursePrerequisites": "Nursing degree or currently enrolled in nursing school",
  "teaches": [
    "NCLEX-RN exam strategies",
    "Nursing fundamentals",
    "Pharmacology",
    "Medical-surgical nursing",
    "Pediatric nursing",
    "Maternal-newborn nursing",
    "Psychiatric nursing"
  ]
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: "NurseBrace - Practice for NCLEX, ATI TEAS & HESI A2 Exams | 10,000+ Questions",
    description: "Master your nursing exams with 10,000+ practice questions for NCLEX-RN, NCLEX-PN, ATI TEAS, and HESI A2. Get instant feedback, detailed explanations, and track your progress. Free trial available.",
    keywords: "NCLEX practice questions, ATI TEAS prep, HESI A2 practice, nursing exam preparation, NCLEX-RN, NCLEX-PN, nursing student study tools, nurse licensure exam, nursing test bank, nursing practice tests, nclex practice, nurse brace, nursebrace",
  },
  pricing: {
    title: "Pricing Plans - NurseBrace | Affordable Nursing Exam Prep",
    description: "Choose the perfect plan for your nursing exam preparation. Start with a free trial or subscribe for unlimited access to 10,000+ NCLEX, TEAS, and HESI practice questions. Plans from $5/week.",
    keywords: "nursing exam prep pricing, NCLEX subscription, affordable nursing test prep, nursing student discounts, NCLEX practice cost, TEAS prep pricing, HESI study plans",
  },
  nclex: {
    title: "NCLEX Practice Questions - RN & PN | NurseBrace",
    description: "Prepare for NCLEX-RN and NCLEX-PN with thousands of practice questions. Get detailed explanations, instant feedback, and track your progress. Pass your nursing licensure exam with confidence.",
    keywords: "NCLEX practice questions, NCLEX-RN prep, NCLEX-PN study, nursing licensure exam, NCLEX test bank, NCLEX review, pass NCLEX, NCLEX preparation, NCLEX questions and answers",
  },
  teas: {
    title: "ATI TEAS Practice Tests & Questions | NurseBrace",
    description: "Ace the ATI TEAS exam with comprehensive practice questions covering reading, math, science, and English. Get instant scoring and detailed explanations for every question.",
    keywords: "ATI TEAS practice test, TEAS 7 prep, TEAS study guide, nursing school entrance exam, TEAS practice questions, ATI TEAS 7, TEAS test preparation, TEAS review",
  },
  hesi: {
    title: "HESI A2 Practice Tests & Study Guide | NurseBrace",
    description: "Prepare for the HESI A2 admission assessment with targeted practice questions. Master math, reading comprehension, vocabulary, grammar, biology, chemistry, and anatomy.",
    keywords: "HESI A2 practice test, HESI admission assessment, HESI study guide, HESI prep, nursing school admission test, HESI practice questions, HESI exam prep",
  },
  categories: {
    title: "Exam Categories - Choose Your Practice Path | NurseBrace",
    description: "Select from NCLEX-RN, NCLEX-PN, ATI TEAS, or HESI A2 practice exams. All categories include detailed topic breakdowns and performance tracking.",
    keywords: "nursing exam categories, NCLEX topics, TEAS subjects, HESI categories, nursing practice by subject",
  },
};

// Common typo variations (for content inclusion)
export const brandTypos = [
  "nursebrace",
  "nurse brace",
  "nursbrace",
  "nursebrac",
  "nurce brace",
  "nurse brase",
  "nursbraces",
  "nursebracce",
];

// Competitor and comparison keywords
export const comparisonKeywords = [
  "NurseBrace vs UWorld",
  "NurseBrace vs Kaplan",
  "NurseBrace vs ATI",
  "NurseBrace vs Hurst Review",
  "best NCLEX prep course",
  "best nursing exam prep",
  "NCLEX study resources",
  "nursing test prep comparison",
];
