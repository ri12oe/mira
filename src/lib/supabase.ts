import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";

import type { Database } from "@/lib/database.types";

// Phones use expo-sqlite, web uses the browser (see session-storage*.ts)
import { authStorage } from "@/lib/session-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase settings. Copy .env.example to .env, fill it in, then restart `npx expo start`.",
  );
}

/** The one Supabase client the whole app shares */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage, // keeps the caregiver signed in across restarts
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // only needed on the web
  },
});

// Only refresh the sign-in token while the app is open
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

