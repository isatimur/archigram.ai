import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { init as initPlausible } from '@plausible-analytics/tracker';
import './app/globals.css';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import EditorWithProviders from '@/app/_components/EditorWithProviders';

Sentry.init({
  dsn:
    (import.meta.env.VITE_SENTRY_DSN as string | undefined) ||
    'https://6df6ce65adf446ef0199ed32eb46db69@o4509755805466624.ingest.de.sentry.io/4510818400862288',
  environment: import.meta.env.MODE || 'development',
  sendDefaultPii: import.meta.env.PROD === true,
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  enabled: import.meta.env.PROD || import.meta.env.VITE_SENTRY_ENABLED === 'true',
});

initPlausible({
  domain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || 'archigram-ai.vercel.app',
  endpoint: 'https://plausible.io/api/event',
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <EditorWithProviders />
    </AuthProvider>
  </React.StrictMode>
);
