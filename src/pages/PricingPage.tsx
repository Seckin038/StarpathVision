import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session');
      if (error) throw new Error(error.message);
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      setLoading(false);
    }
  };

  const isPremium = profile?.plan === 'premium';

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-amber-200">Kies Jouw Pad</h1>
        <p className="text-stone-400 mt-2">Ontgrendel het volledige potentieel van StarpathVision.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardHeader>
            <CardTitle>Free</CardTitle>
            <CardDescription>Begin je reis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-stone-300">
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Toegang tot standaard waarzeggers</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Dagelijkse tarotkaart</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Sla je lezingen op</li>
            </ul>
            <Button variant="outline" disabled className="w-full mt-4">Huidig Plan</Button>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-amber-700">
          <CardHeader>
            <CardTitle>Premium</CardTitle>
            <CardDescription>Voor de serieuze zoeker</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-stone-300">
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-400" /> Alles in Free, plus:</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-400" /> Toegang tot alle premium waarzeggers</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-400" /> Meer diepgaande en gepersonaliseerde lezingen</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-400" /> Prioriteit-ondersteuning</li>
            </ul>
            {isPremium ? (
              <Button disabled className="w-full mt-4">Je bent al Premium</Button>
            ) : (
              <Button onClick={handleCheckout} disabled={loading} className="w-full mt-4 bg-amber-700 hover:bg-amber-600 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upgrade nu
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="text-center mt-8">
        <Link to="/dashboard" className="text-sm text-stone-400 hover:text-amber-300">Terug naar Dashboard</Link>
      </div>
    </div>
  );
}