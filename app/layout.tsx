import React from 'react';
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { LegacyHashRouter } from './_components/LegacyHashRouter';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ArchiGram.ai | AI Architecture Diagramming & System Design Tool',
    template: '%s | ArchiGram.ai',
  },
  description:
    'The intelligent canvas for modern engineering. Generate Mermaid.js diagrams with Gemini AI. Visualize microservices, ML pipelines, and cloud infrastructure instantly.',
  keywords: [
    'archigram',
    'ai diagram generator',
    'text to mermaid',
    'system design tool',
    'mermaid diagram tool',
    'architecture diagram AI',
    'text to diagram AI',
    'free mermaid editor',
  ],
  authors: [{ name: 'ArchiGram.ai OSS' }],
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  openGraph: {
    type: 'website',
    siteName: 'ArchiGram.ai',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          {/* Redirect old hash-based bookmarks to clean URLs */}
          <LegacyHashRouter />
          {children}
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
