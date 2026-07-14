import { createClient } from '@supabase/supabase-js';

/**
 * ABYA_TV read-only client.
 *
 * ZERO-PII CONTRACT (do not break):
 *  - Anon key only. There is no service-role key anywhere in this app.
 *  - No auth. We use the plain supabase-js client, NOT @supabase/ssr — there
 *    are no cookies, no sessions, no user to persist.
 *  - persistSession / autoRefreshToken are OFF: nothing about a visitor is
 *    ever stored, in localStorage or anywhere else.
 *  - RLS on the ABYA_TV project restricts this key to public-read of the three
 *    vetted-content tables. The app is structurally incapable of writing PII.
 */
export function createReadOnlyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'abya.tv reads the ABYA_TV project with the anon key only.'
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
