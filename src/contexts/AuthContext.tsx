import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

type Profile = { id?: string; plan?: string } & Record<string, any>;

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

  async function loadSessionAndProfile(sess: Session | null) {
    setSession(sess);
    const u = sess?.user ?? null;
    setUser(u);

    if (!u) {
      setProfile(null);
      return;
    }

    try {
      // Zorg dat er ALTJD een profile‑rij is (voorkomt 401/404 deadlock)
      await supabase.from('profiles').upsert({ id: u.id }, { onConflict: 'id' });

      const { data: p, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .single();

      if (error) {
        console.warn('[Auth] profile load error:', error.message);
        setProfile({ id: u.id, plan: 'free' });
      } else {
        setProfile(p ?? { id: u.id, plan: 'free' });
      }
    } catch (e: any) {
      console.error('[Auth] unexpected error loading profile', e);
      setProfile({ id: u.id, plan: 'free' });
    }
  }

  useEffect(() => {
    let unsub: { unsubscribe: () => void } | null = null;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        await loadSessionAndProfile(data.session ?? null);
      } finally {
        // zelfs bij fouten: nooit hangen
        setLoading(false);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, sess) => {
      await loadSessionAndProfile(sess ?? null);
    });
    unsub = sub.subscription;

    return () => {
      try { unsub?.unsubscribe(); } catch {}
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  const value: AuthCtx = { user, session, profile, loading, signOut };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}