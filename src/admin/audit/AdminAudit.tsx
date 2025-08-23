import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type AuditLog = {
  id: number;
  created_at: string;
  action: string;
  meta: any;
  user_id: string;
};

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (userId) {
        query = query.eq("user_id", userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching audit logs:", error);
      } else {
        setLogs(data as AuditLog[]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [searchParams, userId]);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>;
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-amber-200">
            {userId ? `Audit Logs voor gebruiker` : 'Audit Logs'}
          </CardTitle>
          {userId && (
            <Button asChild variant="outline">
              <Link to="/admin/audit">Filter wissen</Link>
            </Button>
          )}
        </div>
        {userId && <p className="text-sm text-stone-400 font-mono pt-2">{userId}</p>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-400">
                <th className="p-2">Tijdstip</th>
                <th className="p-2">Actie</th>
                <th className="p-2">Details</th>
                <th className="p-2">User ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-stone-800 align-top">
                  <td className="p-2 whitespace-nowrap text-stone-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-2"><Badge variant="outline">{log.action}</Badge></td>
                  <td className="p-2 font-mono text-xs bg-stone-950/50 rounded-md">
                    <pre>{JSON.stringify(log.meta, null, 2)}</pre>
                  </td>
                  <td className="p-2 font-mono text-xs text-stone-500">{log.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}