
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { Plausible } from '@plausible-analytics/tracker';

console.log("Initializing ArchiGram AI...");

// Initialize Plausible Analytics
Plausible.init({
  domain: 'archigram-ai.vercel.app',
  apiHost: 'https://plausible.io'
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
  console.log("React mounted successfully.");
} catch (error) {
  console.error("Failed to mount React app:", error);
}
