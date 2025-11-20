import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export function SEO({
  title = "NurseBrace - Practice for NCLEX, ATI TEAS & HESI A2 Exams",
  description = "Master your nursing exams with 10,000+ comprehensive practice questions for NCLEX-RN, NCLEX-PN, ATI TEAS, and HESI A2. Get instant feedback, detailed explanations, and track your progress. Perfect for nursing students preparing for licensure exams.",
  keywords = "NCLEX practice questions, ATI TEAS prep, HESI A2 practice, nursing exam preparation, NCLEX-RN, NCLEX-PN, nursing student study tools, nurse licensure exam, nursing test bank, nursing practice tests",
  ogImage = "/og-image.png",
  ogType = "website",
  canonicalUrl,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set or update meta tag
    const setMetaTag = (selector: string, attribute: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.includes('property')) {
          element.setAttribute('property', selector.replace('meta[property="', '').replace('"]', ''));
        } else if (selector.includes('name')) {
          element.setAttribute('name', selector.replace('meta[name="', '').replace('"]', ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    // Set basic meta tags
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[name="keywords"]', 'content', keywords);

    // Set OpenGraph tags
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:type"]', 'content', ogType);
    setMetaTag('meta[property="og:image"]', 'content', ogImage);
    
    // Get current URL for og:url
    const currentUrl = canonicalUrl || window.location.href;
    setMetaTag('meta[property="og:url"]', 'content', currentUrl);
    setMetaTag('meta[property="og:site_name"]', 'content', 'NurseBrace');

    // Set Twitter Card tags
    setMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    // Set canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = currentUrl;

    // Add structured data if provided
    if (structuredData) {
      let scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, ogImage, ogType, canonicalUrl, structuredData]);

  return null; // This component doesn't render anything
}
