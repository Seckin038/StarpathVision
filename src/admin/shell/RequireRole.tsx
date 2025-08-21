import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // Ensure this path is correct
import { useNavigate } from "react-router-dom";

export default function RequireRole({ roles, children }: { roles: string[]; children: ReactNode }) {
  const nav = useNavigate();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setOk(false);
        nav("/login");
        return;
      }
      const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (error) {
        console.error("Error fetching profile:", error);
        setOk(false);
        nav("/");
        return;
      }
      const userRole = data?.role ?? "user";
      const hasRequiredRole = roles.includes(userRole);
      setOk(hasRequiredRole);
      if (!hasRequiredRole) {
        nav("/");
      }
    };
    checkRole();
  }, [roles, nav]);

  if (ok === null) return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-stone-400">Bezig met verifiëren…</div>;
  if (!ok) return <div className="min-h-screen flex items-center justify-center bg-stone-950 text-red-400">403 — Geen toegang</div>;
  return <>{children}</>;
}