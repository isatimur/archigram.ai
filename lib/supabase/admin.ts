/**
 * Supabase admin client using the service role key.
 *
 * Use ONLY in Route Handlers and server-side code where elevated privileges
 * are required (newsletter subscriptions, admin operations, etc.).
 * NEVER import this in client components or expose to the browser.
 */

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
