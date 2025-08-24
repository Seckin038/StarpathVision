import { createClient } from '@supabase/supabase-js';

// TIJDELIJKE OPLOSSING: De verbindingsgegevens zijn hier direct ingevoerd
// om de applicatie werkend te krijgen. De veiligste methode is om
// deze via Environment Variables in te stellen.
const url = "https://dmsrsgecdvoswxopylfm.supabase.co";
const anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc3JzZ2VjZHZvc3d4b3B5bGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0ODg2NTMsImV4cCI6MjA3MTA2NDY1M30._S7NgAKdoVNZSYx6kcJhRrRbUuxXPrR0bdKqHCjOjxk";

if (!url || !anon) {
  // Zorg dat we niet stil blijven hangen; log zichtbaar in console.
  console.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});