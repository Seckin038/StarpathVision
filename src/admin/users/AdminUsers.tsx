import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, Trash2, UserPlus, FileDown, Edit, ShieldAlert, History } from "lucide-react";

type UserWithProfile = {
  id: string;
  email: string;
  created_at: string;
  full_name: string | null;
  role: string | null;
  plan: string | null;
  status: string | null;
};

const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || user.email?.toLowerCase().includes(searchLower) || user.full_name?.toLowerCase().includes(searchLower);
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesPlan = planFilter === 'all' || user.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      return matchesSearch && matchesRole && matchesPlan && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, planFilter, statusFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const handleStatusChange = async (userId: string, currentStatus: string | null) => {
    const newStatus = currentStatus === 'Actief' ? 'Geblokkeerd' : 'Actief';
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (error) {
      showError(`Status wijzigen mislukt: ${error.message}`);
    } else {
      showSuccess("Status succesvol gewijzigd.");
      fetchUsers();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Weet je zeker dat je deze gebruiker permanent wilt verwijderen?")) return;
    const { error } = await supabase.functions.invoke("admin-delete-user", { body: { userIdToDelete: userId } });
    if (error) {
      showError(`Verwijderen mislukt: ${error.message}`);
    } else {
      showSuccess("Gebruiker succesvol verwijderd.");
      fetchUsers();
    }
  };
  
  const exportToCSV = () => {
    const headers = ["E-mail", "Naam", "Rol", "Plan", "Status", "Aangemaakt"];
    const rows = filteredUsers.map(user => [
        `"${user.email || ''}"`,
        `"${user.full_name || ''}"`,
        `"${user.role || 'user'}"`,
        `"${user.plan || 'Free'}"`,
        `"${user.status || 'Active'}"`,
        `"${new Date(user.created_at).toLocaleDateString('nl-NL')}"`
    ].join(','));

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "gebruikers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getBadgeClass = (type: 'role' | 'plan' | 'status', value: string | null) => {
    const v = value?.toLowerCase();
    switch (type) {
      case 'role':
        if (v === 'admin') return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
        if (v === 'editor') return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
        return 'bg-stone-700 text-stone-300 border-stone-600';
      case 'plan':
        if (v === 'premium') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
        if (v === 'pro') return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
        return 'bg-stone-700 text-stone-300 border-stone-600';
      case 'status':
        if (v === 'actief') return 'bg-green-500/20 text-green-300 border-green-500/50';
        if (v === 'geblokkeerd') return 'bg-red-500/20 text-red-300 border-red-500/50';
        return 'bg-stone-700 text-stone-300 border-stone-600';
      default: return '';
    }
  };

  return (
    <Card className="bg-stone-900/60 border-stone-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-amber-200">Gebruikersbeheer</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline"><UserPlus className="h-4 w-4 mr-2" /> Nodig gebruiker uit</Button>
            <Button variant="outline" onClick={exportToCSV}><FileDown className="h-4 w-4 mr-2" /> Export CSV</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder="Zoek op naam of e-mail..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
          <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle rollen</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="editor">Editor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
          <Select value={planFilter} onValueChange={setPlanFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle plannen</SelectItem><SelectItem value="Free">Free</SelectItem><SelectItem value="Pro">Pro</SelectItem><SelectItem value="Premium">Premium</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Alle statussen</SelectItem><SelectItem value="Actief">Actief</SelectItem><SelectItem value="Geblokkeerd">Geblokkeerd</SelectItem></SelectContent></Select>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-400">
                    {["E-mail", "Naam", "Rol", "Plan", "Status", "Aangemaakt", "Acties"].map(h => <th key={h} className="p-2 font-normal">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-t border-stone-800 hover:bg-stone-900/50">
                      <td className="p-2">{user.email}</td>
                      <td className="p-2">{user.full_name || <span className="text-stone-500">N/A</span>}</td>
                      <td className="p-2"><Badge variant="outline" className={getBadgeClass('role', user.role)}>{user.role || 'user'}</Badge></td>
                      <td className="p-2"><Badge variant="outline" className={getBadgeClass('plan', user.plan)}>{user.plan || 'Free'}</Badge></td>
                      <td className="p-2"><Badge variant="outline" className={getBadgeClass('status', user.status)}>{user.status || 'Actief'}</Badge></td>
                      <td className="p-2">{new Date(user.created_at).toLocaleDateString('nl-NL')}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatusChange(user.id, user.status)}><ShieldAlert className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><History className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-stone-400">Pagina {currentPage} van {totalPages} ({filteredUsers.length} resultaten)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Vorige</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>Volgende</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}