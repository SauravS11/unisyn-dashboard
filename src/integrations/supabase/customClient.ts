// Custom Supabase client pointing to the user-owned Supabase project.
// We bypass the auto-managed client.ts / .env (which keep reverting to the old
// Lovable Cloud project) by hard-coding the new project's URL + anon key here.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://cewlianjjbqkxopqpirb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld2xpYW5qamJxa3hvcHFwaXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzg2NTEsImV4cCI6MjA5NDYxNDY1MX0.7G7XLsWABPa7_G3YKnrK-4ZfsAoNbZf3bmYlxDF-Ae4';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
