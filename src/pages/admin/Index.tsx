import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";

const Forbidden = () => (
  <div className="text-center p-8">
    <h1 className="text-2xl text-red-400">Toegang Geweigerd</h1>
    <p className="text-stone-400">Je hebt geen toestemming om deze pagina te bekijken.</p>
  </div>
);

const AdminHome = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold text-amber-200">Admin Dashboard</h1>
    <p className="text-stone-300 mt-2">Welkom, beheerder. Hier kun je gebruikers, lezingen en andere data beheren.</p>
    {/* Admin content will go here */}
  </div>
);

export default function AdminDashboardPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-amber-400" /></div>;
  }

  return isAdmin ? <AdminHome /> : <Forbidden />;
}