import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      
      if (error) {
        console.error("Error fetching audit logs:", error);
      } else {
        setLogs(data as AuditLog[]);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>;
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <CardTitle className="text-amber-200">Audit Logs</CardTitle>
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