import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MysticalBackground from "@/components/MysticalBackground";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
    } else {
      navigate("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 flex items-center justify-center font-serif">
      <MysticalBackground mode="gradient" />
      <Card className="w-full max-w-sm bg-stone-900/50 backdrop-blur-sm border-stone-800 z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-amber-200 text-center">Welkom Terug</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.com" required className="bg-stone-900 border-stone-700 focus:ring-amber-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-stone-900 border-stone-700 focus:ring-amber-500" />
            </div>
            <Button type="submit" className="w-full bg-amber-800 hover:bg-amber-700 text-stone-100" disabled={loading}>
              {loading ? "Inloggen..." : "Log in"}
            </Button>
          </form>
          {err && <p className="text-red-400 text-sm mt-4 text-center">{err}</p>}
          <div className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-stone-400 hover:text-amber-300 underline">
              Wachtwoord vergeten?
            </Link>
          </div>
          <div className="mt-2 text-center text-sm">
            Nog geen account?{" "}
            <Link to="/register" className="text-amber-300 hover:text-amber-200 underline">
              Registreer hier
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}