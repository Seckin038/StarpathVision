import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
          if (profileError) {
            console.error("Error fetching profile on auth change:", profileError.message);
            setProfile(null);
          } else {
            setProfile(profileData as Profile | null);
          }
        } catch (error) {
          console.error("Exception fetching profile on auth change:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    // The onAuthStateChange listener will handle clearing user, session, and profile state.
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signOut,
  };

  return (
    <Ctx.Provider value={value}>
      {!loading && children}
    </Ctx.Provider>
  );
}