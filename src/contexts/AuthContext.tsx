import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";

type Profile = {
  plan: string;
  [key: string]: any;
};

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({} as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setSession(session);
        if (session?.user) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Profile fetch error on auth change:", error);
            setProfile(null);
          } else {
            setProfile(data as Profile);
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("Critical error in onAuthStateChange:", e);
      } finally {
        // This is the crucial fix: ensure loading is always set to false
        // after the initial auth check completes, regardless of success or failure.
        setLoading(false);
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

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}