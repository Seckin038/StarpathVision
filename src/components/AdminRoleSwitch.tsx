import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

const OWNER_EMAIL = "seckin52@hotmail.com";

export default function AdminRoleSwitch() {
  const [allowed, setAllowed] = useState(false);
  const [role, setRole] = useState<string>("user");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (user.email || "").toLowerCase() !== OWNER_EMAIL) {
        setAllowed(false); return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      setAllowed(true);
      setRole(data?.role || "user");
    })();
  }, []);

  if (!allowed) return null;

  const toggle = async () => {
    setBusy(true);
    const next = role === "admin" ? "user" : "admin";
    const { error } = await supabase.rpc("toggle_my_role", { new_role: next });
    setBusy(false);
    if (!error) {
      setRole(next);
      window.location.reload(); // Reload to reflect new role everywhere
    }
    else alert(error.message);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs opacity-70">Rol:</span>
      <span className="px-2 py-1 rounded bg-stone-800 border border-stone-700 text-amber-200 text-xs">
        {role}
      </span>
      <Button size="sm" onClick={toggle} disabled={busy} variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
        {role === "admin" ? "Switch naar user" : "Switch naar admin"}
      </Button>
    </div>
  );
}