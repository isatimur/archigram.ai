// Type shim for import.meta.env used in legacy Vite-era services.
// These files (supabaseClient.ts, ragClient.ts) are transitional and still
// read VITE_* env vars at runtime via the webpack DefinePlugin in next.config.ts.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_KEY?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_RAG_URL?: string;
  readonly VITE_RAG_ENABLED?: string;
  readonly MODE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly SSR?: boolean;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
