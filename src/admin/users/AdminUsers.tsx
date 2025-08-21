import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Trash2 } from "lucide-react";

type UserWithProfile = {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  role: string | null;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_users_with_profiles");
    if (error) {
      showError(`Kon gebruikers niet laden: ${error.message}`);
    } else {
      setUsers(data as UserWithProfile[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
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
      fetchUsers(); // Refresh the list
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
      fetchUsers(); // Refresh the list
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
                <th className="p-2">E-mail</th>
                <th className="p-2">Naam</th>
                <th className="p-2">Rol</th>
                <th className="p-2">Acties</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-stone-800">
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.full_name || <span className="text-stone-500">N/A</span>}</td>
                  <td className="p-2 w-48">
                    <Select
                      value={user.role || 'user'}
                      onValueChange={(newRole) => handleRoleChange(user.id, newRole)}
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
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)}>
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