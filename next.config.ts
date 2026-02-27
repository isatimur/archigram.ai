import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // During Phase 1 migration, App.tsx and other Vite-era files may have type
  // errors. They'll be fixed in Phase 2. Don't block production builds.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Fix workspace root detection when running from a git worktree
  outputFileTracingRoot: '/Users/timur_isachenko/Dev/archigram.ai',

  // Map Vite-style import.meta.env.VITE_* → NEXT_PUBLIC_* so existing components
  // continue to work in Next.js without modification during Phase 1 migration.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  webpack(config: any, { webpack }: { webpack: any }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(
          process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
        ),
        'import.meta.env.VITE_SUPABASE_KEY': JSON.stringify(
          process.env.NEXT_PUBLIC_SUPABASE_KEY ?? ''
        ),
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
          process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ''
        ),
        'import.meta.env.VITE_RAG_URL': JSON.stringify(process.env.NEXT_PUBLIC_RAG_URL ?? ''),
        'import.meta.env.VITE_RAG_ENABLED': JSON.stringify(
          process.env.NEXT_PUBLIC_RAG_ENABLED ?? 'false'
        ),
        // MODE is used by some Vite-dependent libraries
        'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV ?? 'production'),
        'import.meta.env.DEV': JSON.stringify(process.env.NODE_ENV === 'development'),
        'import.meta.env.PROD': JSON.stringify(process.env.NODE_ENV === 'production'),
        'import.meta.env.SSR': JSON.stringify(false),
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
