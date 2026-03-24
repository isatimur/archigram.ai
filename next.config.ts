import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // mermaid 11.x and bpmn-js are pure ESM with internal dynamic imports. Without
  // this, webpack splits them into chunks with path-based names Next.js can't serve.
  transpilePackages: ['mermaid', 'bpmn-js'],

  // During Phase 1 migration, App.tsx and other Vite-era files may have type
  // errors. They'll be fixed in Phase 2. Don't block production builds.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Map Vite-style import.meta.env.VITE_* → NEXT_PUBLIC_* so existing components
  // continue to work in Next.js without modification during Phase 1 migration.
  // Also falls back to VITE_* env var names so existing Vercel projects work
  // without renaming variables.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { webpack, isServer }: { webpack: any; isServer: boolean }) {
    // Bundle all mermaid sub-packages into a single chunk so path-based chunk
    // names (which Next.js can't serve) are never generated.
    if (!isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          mermaid: {
            name: 'mermaid',
            test: /[\\/]node_modules[\\/](mermaid|@mermaid-js)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          bpmnjs: {
            name: 'bpmn-js',
            test: /[\\/]node_modules[\\/](bpmn-js|bpmn-moddle|moddle|diagram-js|min-dash|min-dom)[\\/]/,
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
        },
      };
    }

    // Resolve with VITE_* fallbacks so existing Vercel env vars keep working
    // during the migration before NEXT_PUBLIC_* names are added to the project.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY ?? process.env.VITE_SUPABASE_KEY ?? '';
    const ragUrl = process.env.NEXT_PUBLIC_RAG_URL ?? process.env.VITE_RAG_URL ?? '';
    const ragEnabled =
      process.env.NEXT_PUBLIC_RAG_ENABLED ?? process.env.VITE_RAG_ENABLED ?? 'false';

    config.plugins.push(
      new webpack.DefinePlugin({
        // import.meta.env shim for Vite-era components still using VITE_* names
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(supabaseKey),
        'import.meta.env.VITE_RAG_URL': JSON.stringify(ragUrl),
        'import.meta.env.VITE_RAG_ENABLED': JSON.stringify(ragEnabled),
        // MODE is used by some Vite-dependent libraries
        'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development'),
        'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
        'import.meta.env.SSR': JSON.stringify(false),
        // Override NEXT_PUBLIC_ vars so lib/supabase/browser.ts picks them up
        // even when only the legacy VITE_* names are set in the Vercel project.
        'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
        'process.env.NEXT_PUBLIC_SUPABASE_KEY': JSON.stringify(supabaseKey),
        'process.env.NEXT_PUBLIC_RAG_URL': JSON.stringify(ragUrl),
        'process.env.NEXT_PUBLIC_RAG_ENABLED': JSON.stringify(ragEnabled),
      })
    );
    return config;
  },

  // Security headers (migrated from vercel.json)
  async headers() {
    return [
      {
        source: '/assets/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed by mermaid
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://plausible.io https://esm.sh",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Redirect legacy ?embed=true URLs to /embed route
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'query', key: 'embed' }],
        destination: '/embed',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
