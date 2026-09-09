import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface DbFavorite {
  id: string;
  user_id: string;
  symbol: string;
  created_at: string;
}

export interface DbAlert {
  id: string;
  user_id: string;
  symbol: string;
  target_price: number;
  direction: 'above' | 'below';
  note: string | null;
  triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}
