import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { init as initPlausible } from '@plausible-analytics/tracker';

console.log('Initializing ArchiGram AI...');

// Initialize Sentry for error tracking
Sentry.init({
  dsn:
    import.meta.env.VITE_SENTRY_DSN ||
    'https://6df6ce65adf446ef0199ed32eb46db69@o4509755805466624.ingest.de.sentry.io/4510818400862288',
  environment: import.meta.env.MODE || 'development',
  // Only send PII in production with explicit consent
  sendDefaultPii: import.meta.env.PROD,
  // Sample rate for performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  // Only enable in production or when explicitly set
  enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',
});

// Initialize Plausible Analytics
initPlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'archigram-ai.vercel.app',
  endpoint: 'https://plausible.io/api/event',
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Could not find root element to mount to');
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('React mounted successfully.');
} catch (error) {
  console.error('Failed to mount React app:', error);
}
