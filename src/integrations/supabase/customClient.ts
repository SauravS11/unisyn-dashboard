// Custom Supabase client pointing to the user-owned Supabase project.
// Each browser tab keeps its OWN login (sessionStorage + per-tab storage key),
// so different accounts can be signed in side by side without tabs mirroring
// or signing each other out.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://cewlianjjbqkxopqpirb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld2xpYW5qamJxa3hvcHFwaXJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzg2NTEsImV4cCI6MjA5NDYxNDY1MX0.7G7XLsWABPa7_G3YKnrK-4ZfsAoNbZf3bmYlxDF-Ae4';

const TAB_ID_KEY = 'unisyn-tab-id';
const getTabId = () => {
  let id = sessionStorage.getItem(TAB_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(TAB_ID_KEY, id);
  }
  return id;
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorage,
    // Unique key per tab also isolates the cross-tab broadcast channel.
    storageKey: `unisyn-auth-${getTabId()}`,
    persistSession: true,
    autoRefreshToken: true,
  },
});
