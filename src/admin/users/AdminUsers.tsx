import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Trash2 } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("id, full_name, role");
    if (error) {
      showError("Kon profielen niet laden.");
    } else {
      setProfiles(data as Profile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.rpc('set_user_role', {
      target_user_id: userId,
      new_role: newRole
    });

    if (error) {
      showError(`Rol wijzigen mislukt: ${error.message}`);
    } else {
      showSuccess("Rol succesvol gewijzigd.");
      fetchProfiles(); // Refresh the list
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Weet je zeker dat je deze gebruiker permanent wilt verwijderen? Dit kan niet ongedaan worden gemaakt en verwijdert de gebruiker uit de 'auth.users' tabel.")) {
      return;
    }
    
    const { error } = await supabase.functions.invoke("admin-delete-user", {
      body: { userIdToDelete: userId },
    });

    if (error) {
      showError(`Verwijderen mislukt: ${error.message}`);
    } else {
      showSuccess("Gebruiker succesvol verwijderd.");
      fetchProfiles(); // Refresh the list
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-amber-400" /></div>;
  }

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <CardTitle className="text-amber-200">Gebruikersbeheer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-400">
                <th className="p-2">Naam</th>
                <th className="p-2">User ID</th>
                <th className="p-2">Rol</th>
                <th className="p-2">Acties</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id} className="border-t border-stone-800">
                  <td className="p-2">{profile.full_name || "N/A"}</td>
                  <td className="p-2 font-mono text-xs">{profile.id}</td>
                  <td className="p-2 w-48">
                    <Select
                      value={profile.role}
                      onValueChange={(newRole) => handleRoleChange(profile.id, newRole)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(profile.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}