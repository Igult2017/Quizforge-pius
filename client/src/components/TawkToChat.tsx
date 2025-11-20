import { useEffect } from 'react';

export function TawkToChat() {
  useEffect(() => {
    // Get Tawk.to Property ID from environment variable
    const tawkPropertyId = import.meta.env.VITE_TAWK_PROPERTY_ID;
    
    // Only load if property ID is configured
    if (!tawkPropertyId) {
      console.log('[TawkTo] Property ID not configured. Skipping chat widget.');
      return;
    }

    // Check if Tawk.to is already loaded to prevent duplicate loading
    if ((window as any).Tawk_API) {
      console.log('[TawkTo] Chat widget already loaded.');
      return;
    }

    // Initialize Tawk_API
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Create and inject the Tawk.to script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${tawkPropertyId}/default`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    // Add script to page
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Optional: Configure Tawk.to widget appearance and behavior
    (window as any).Tawk_API.onLoad = function() {
      console.log('[TawkTo] Chat widget loaded successfully');
      
      // Customize widget appearance (optional)
      // (window as any).Tawk_API.setAttributes({
      //   name: 'User Name',
      //   email: 'user@example.com'
      // }, function(error: any) {});
    };

    // Cleanup function
    return () => {
      // Note: Tawk.to doesn't provide a clean removal method
      // The widget persists across page navigation which is desired behavior
    };
  }, []);

  // This component doesn't render anything visible
  // The Tawk.to widget injects itself into the page
  return null;
}
