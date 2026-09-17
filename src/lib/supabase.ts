import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service-role key. It bypasses RLS and must never reach
 * the browser — `server-only` makes any client import a build error.
 */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "assignments";

const globalForSupabase = globalThis as unknown as { supabase?: SupabaseClient };

function create(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

/** Lazily created so a missing env var fails at first use, not at import time. */
export function supabaseAdmin(): SupabaseClient {
  if (!globalForSupabase.supabase) globalForSupabase.supabase = create();
  return globalForSupabase.supabase;
}
