import { SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseConfig {
  url: string;
  key: string;
  bucket: string;
}

export type AppSupabaseClient = SupabaseClient;
