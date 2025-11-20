import { useEffect } from 'react';

export function TawkToChat() {
  useEffect(() => {
    // Check if Tawk.to is already loaded to prevent duplicate loading
    if ((window as any).Tawk_API) {
      console.log('[TawkTo] Chat widget already loaded.');
      return;
    }

    // Initialize Tawk_API (exactly as provided by Tawk.to)
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Create and inject the Tawk.to script (using exact URL from Tawk.to dashboard)
    const script = document.createElement('script');
    const firstScript = document.getElementsByTagName('script')[0];
    script.async = true;
    script.src = 'https://embed.tawk.to/691dee86e16d0a1950344e8b/1jaeeng2p';
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Log when widget loads
    (window as any).Tawk_API.onLoad = function() {
      console.log('[TawkTo] Chat widget loaded successfully');
    };
  }, []);

  // This component doesn't render anything visible
  // The Tawk.to widget injects itself into the page
  return null;
}
