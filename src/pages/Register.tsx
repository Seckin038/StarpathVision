import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setOk(false);

    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setErr(error.message);
    } else {
      setOk(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-sm bg-stone-900/50 backdrop-blur-sm border-stone-800 z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-200 text-center">Account Aanmaken</CardTitle>
        </CardHeader>
        <CardContent>
          {ok ? (
            <div className="text-center text-emerald-400">
              <p>Controleer je e-mail om je account te bevestigen.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.com" required className="bg-stone-900 border-stone-700 focus:ring-amber-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Wachtwoord</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min. 6 tekens" required className="bg-stone-900 border-stone-700 focus:ring-amber-500" />
              </div>
              <Button type="submit" className="w-full bg-amber-800 hover:bg-amber-700 text-stone-100" disabled={loading}>
                {loading ? "Registreren..." : "Registreer"}
              </Button>
            </form>
          )}
          {err && <p className="text-red-400 text-sm mt-4 text-center">{err}</p>}
          <div className="mt-4 text-center text-sm">
            Al een account?{" "}
            <Link to="/login" className="text-amber-300 hover:text-amber-200 underline">
              Log hier in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}