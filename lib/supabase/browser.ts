import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client using the public anon key.
 * Only for read-only or public operations.
 * All write operations should go through server actions / route handlers.
 */
let browserClient: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  browserClient = createClient(supabaseUrl, anonKey);
  return browserClient;
}
