import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from "@/utils/toast";
import { Loader2, UserPlus, FileDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation('admin');
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserWithProfile | null>(null);
  const [newRole, setNewRole] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteMethod, setInviteMethod] = useState("invite");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

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

  const handleOpenRoleModal = (user: UserWithProfile) => {
    setNewRole(user.role || 'user');
    setEditingUser(user);
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    const { error } = await supabase.rpc('set_user_role', {
        target_user_id: editingUser.id,
        new_role: newRole,
    });
    if (error) {
        showError(`Rol wijzigen mislukt: ${error.message}`);
    } else {
        showSuccess("Rol succesvol gewijzigd.");
        fetchUsers();
        setEditingUser(null);
    }
  };

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

  const handleInviteUser = async () => {
    if (!inviteEmail) {
        showError("E-mailadres is verplicht.");
        return;
    }
    if (inviteMethod === 'create' && !invitePassword) {
        showError("Wachtwoord is verplicht bij direct aanmaken.");
        return;
    }

    setIsInviting(true);

    const body = {
        email: inviteEmail,
        password: inviteMethod === 'create' ? invitePassword : null,
        sendInvite: inviteMethod === 'invite',
        role: inviteRole,
    };

    const { error } = await supabase.functions.invoke("admin-create-user", { body });

    setIsInviting(false);

    if (error) {
        showError(`Uitnodigen mislukt: ${error.message}`);
    } else {
        showSuccess("Gebruiker succesvol aangemaakt/uitgenodigd.");
        setIsInviteModalOpen(false);
        setInviteEmail("");
        setInvitePassword("");
        setInviteRole("user");
        fetchUsers();
    }
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
          <CardTitle className="text-amber-200">{t('users.title')}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}><UserPlus className="h-4 w-4 mr-2" /> {t('users.invite')}</Button>
            <Button variant="outline" onClick={exportToCSV}><FileDown className="h-4 w-4 mr-2" /> {t('users.export')}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4 flex-wrap">
          <Input placeholder={t('users.search_placeholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-xs" />
          <Select value={roleFilter} onValueChange={setRoleFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t('users.all_roles')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('users.all_roles')}</SelectItem><SelectItem value="user">User</SelectItem><SelectItem value="editor">Editor</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select>
          <Select value={planFilter} onValueChange={setPlanFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t('users.all_plans')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('users.all_plans')}</SelectItem><SelectItem value="Free">Free</SelectItem><SelectItem value="Pro">Pro</SelectItem><SelectItem value="Premium">Premium</SelectItem></SelectContent></Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t('users.all_statuses')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('users.all_statuses')}</SelectItem><SelectItem value="Actief">Actief</SelectItem><SelectItem value="Geblokkeerd">Geblokkeerd</SelectItem></SelectContent></Select>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-400">
                    {[t('users.headers.email'), t('users.headers.name'), t('users.headers.role'), t('users.headers.plan'), t('users.headers.status'), t('users.headers.created_at'), t('users.headers.actions')].map(h => <th key={h} className="p-2 font-normal">{h}</th>)}
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
                      <td className="p-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleOpenRoleModal(user)}>{t('users.actions.change_role')}</Button>
                          <Button 
                              size="sm" 
                              className={`px-2 h-6 rounded ${user.status !== 'Geblokkeerd' ? 'bg-red-800 hover:bg-red-700 text-white' : 'bg-green-700 hover:bg-green-600 text-white'}`}
                              onClick={() => handleStatusChange(user.id, user.status)}
                          >
                              {user.status !== 'Geblokkeerd' ? t('users.actions.block') : t('users.actions.unblock')}
                          </Button>
                          <Link to={`/admin/audit?userId=${user.id}`}>
                              <Button size="sm" variant="ghost">{t('users.actions.audit')}</Button>
                          </Link>
                          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteUser(user.id)}>{t('users.actions.delete')}</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-stone-400">{t('users.pagination', { currentPage, totalPages, totalResults: filteredUsers.length })}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>{t('common.previous')}</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>{t('common.next')}</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="bg-stone-900 border-stone-800">
                <DialogHeader>
                    <DialogTitle className="text-amber-200">{t('users.edit_role_title', { email: editingUser.email })}</DialogTitle>
                    <DialogDescription>{t('users.edit_role_desc')}</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingUser(null)}>{t('common.cancel')}</Button>
                    <Button onClick={handleUpdateRole}>{t('common.save')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogContent className="bg-stone-900 border-stone-800">
              <DialogHeader>
                  <DialogTitle className="text-amber-200">{t('users.invite_modal_title')}</DialogTitle>
                  <DialogDescription>{t('users.invite_modal_desc')}</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div>
                      <Label htmlFor="invite-email">{t('users.invite_email_label')}</Label>
                      <Input id="invite-email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="gebruiker@email.com" />
                  </div>
                  <div>
                      <Label htmlFor="invite-role">{t('users.invite_role_label')}</Label>
                      <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <RadioGroup value={inviteMethod} onValueChange={setInviteMethod}>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="invite" id="r-invite" />
                          <Label htmlFor="r-invite">{t('users.invite_method_link')}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                          <RadioGroupItem value="create" id="r-create" />
                          <Label htmlFor="r-create">{t('users.invite_method_create')}</Label>
                      </div>
                  </RadioGroup>
                  {inviteMethod === 'create' && (
                      <div>
                          <Label htmlFor="invite-password">{t('users.invite_password_label')}</Label>
                          <Input id="invite-password" type="text" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Een sterk wachtwoord" />
                      </div>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteModalOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleInviteUser} disabled={isInviting}>
                      {isInviting ? <Loader2 className="animate-spin mr-2" /> : null}
                      {inviteMethod === 'invite' ? t('users.send_invite') : t('users.create_user')}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </Card>
  );
}