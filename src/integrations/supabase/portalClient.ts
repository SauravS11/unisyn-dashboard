// Isolated client for code-based Client Access (respondents / applicants).
// It never reads, writes or listens to the advisor's stored login, so a
// signed-in tab and a client-access tab can run side by side without
// signing each other out or mirroring sessions.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://cewlianjjbqkxopqpirb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld2xpYW5qamJxa3hvcHFwaXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzg2NTEsImV4cCI6MjA5NDYxNDY1MX0.7G7XLsWABPa7_G3YKnrK-4ZfsAoNbZf3bmYlxDF-Ae4';

const memory = new Map<string, string>();

export const portalSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storageKey: 'unisyn-portal-anon',
    storage: {
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    },
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
