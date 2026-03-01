import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    env: {
      VITE_RAG_ENABLED: 'true',
      VITE_RAG_URL: 'http://localhost:8000',
      // Prevent @supabase/supabase-js from throwing "supabaseUrl is required"
      // when supabaseClient.ts is imported during tests
      VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
      VITE_SUPABASE_KEY: 'placeholder-anon-key-for-tests',
    },
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.git', '.cache', '.opencode/**', '.claude/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'services/**/*.ts',
        'utils/**/*.ts',
        'hooks/**/*.ts',
        'constants.ts',
        'data/**/*.ts',
      ],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/tests/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        statements: 70,
        branches: 69,
        functions: 70,
        lines: 70,
      },
    },
    reporters: ['default', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
