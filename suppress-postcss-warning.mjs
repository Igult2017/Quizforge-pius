// Suppress the harmless PostCSS "from" option warning from Tailwind CSS
// This is a known cosmetic issue that doesn't affect functionality
// See: https://github.com/tailwindlabs/tailwindcss-forms/issues/182

const originalWarn = console.warn;
console.warn = function (...args) {
  const message = args.join(' ');
  
  // Filter out the specific PostCSS warning
  if (message.includes('PostCSS plugin') && message.includes('did not pass the `from` option')) {
    return; // Suppress this specific warning
  }
  
  // Pass through all other warnings
  originalWarn.apply(console, args);
};

// Import and run the actual server
await import('./server/index.ts');
