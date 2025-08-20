import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setErr(error.message);
    } else {
      setMsg("Controleer je e-mail voor de herstellink.");
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-sm bg-stone-900/50 backdrop-blur-sm border-stone-800 z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-200 text-center">Wachtwoord Herstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.com" required className="bg-stone-900 border-stone-700 focus:ring-amber-500" />
            </div>
            <Button type="submit" className="w-full bg-amber-800 hover:bg-amber-700 text-stone-100" disabled={loading}>
              {loading ? "Versturen..." : "Verstuur herstellink"}
            </Button>
          </form>
          {msg && <p className="text-emerald-400 text-sm mt-4 text-center">{msg}</p>}
          {err && <p className="text-red-400 text-sm mt-4 text-center">{err}</p>}
          <div className="mt-4 text-center text-sm">
            <Link to="/login" className="text-stone-400 hover:text-amber-300 underline">
              Terug naar inloggen
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}