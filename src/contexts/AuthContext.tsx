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
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData as Profile | null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };
    
    getSessionAndProfile();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      setSession(sess);
      const currentUser = sess?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData as Profile | null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
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