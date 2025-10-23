import { createClient } from "@supabase/supabase-js";
import { SupabaseConfig } from "../types";

const supabaseConfig: SupabaseConfig = {
  url: process.env.SUPABASE_URL || "",
  key: process.env.SUPABASE_KEY || "",
  bucket: process.env.SUPABASE_BUCKET || "profiles",
};

if (!supabaseConfig.url || !supabaseConfig.key) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_KEY must be defined in environment variables"
  );
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.key);

const anonKey = process.env.SUPABASE_ANON_KEY || supabaseConfig.key;
export const supabaseAuth = createClient(supabaseConfig.url, anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export { supabaseConfig };
