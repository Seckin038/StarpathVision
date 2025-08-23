import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { Loader2, AlertTriangle } from "lucide-react";

type Profile = {
  plan: string;
  [key: string]: any;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileError ? null : data as Profile);
        }
      } catch (err: any) {
        console.error("Auth init error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profileError ? null : (data as Profile));
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user: session?.user ?? null,
    session,
    profile,
    loading,
    error,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-800 bg-red-900/20 p-6 text-center text-red-200">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-400" />
          <h2 className="mt-4 text-xl font-bold">Connection Error</h2>
          <p className="mt-2 text-sm text-red-300">Could not connect to the backend. This is likely a configuration issue.</p>
          <p className="mt-4 text-xs font-mono bg-black/20 p-2 rounded">{error}</p>
          <p className="mt-4 text-xs text-red-300/80">Please verify your Supabase URL and Key in `src/lib/supabaseClient.ts` and check your project's RLS policies.</p>
        </div>
      </div>
    );
  }

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}