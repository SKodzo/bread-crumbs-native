import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

const SUPABASE_URL  = "https://nbgrsbarglkawoxwtzfq.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ3JzYmFyZ2xrYXdveHd0emZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NzQ4MTQsImV4cCI6MjA5NzA1MDgxNH0.TyVQnyn2GUrUgXNLn6d2ZIL9RrYJyGA0AkKIrSF-ruA";

const ExpoSecureStoreAdapter = {
  getItem:    (key) => SecureStore.getItemAsync(key),
  setItem:    (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
