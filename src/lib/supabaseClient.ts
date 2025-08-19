import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://dmsrsgecdvoswxopylfm.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc3JzZ2VjZHZvc3d4b3B5bGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODg2NTMsImV4cCI6MjA3MTA2NDY1M30._S7NgAKdoVNZSYx6kcJhRrRbUuxXPrR0bdKqHCjOjxk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true 
  }
});