import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { uploadAvatar } from "@/lib/upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, UploadCloud, LogOut, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import RecentSessions from "@/components/RecentSessions";
import StatisticsPanel from "@/components/StatisticsPanel";
import { getMyProfile, updateMyProfile, getCoreValues } from "@/lib/profile";
import { showError, showSuccess } from "@/utils/toast";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
  roles: string[] | null;
  onboarding_done: boolean | null;
  focus_areas: string[] | null;
  core_values: string[] | null;
  current_mood: string | null;
};

type CoreValue = { id: string; name_nl: string; name_en: string; name_tr: string };

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) { nav("/login"); return; }
      setUserEmail(auth.user.email ?? null);

      const [prof, vals] = await Promise.all([getMyProfile(), getCoreValues()]);
      
      setProfile(prof as Profile | null);
      setDraft(prof ?? { id: auth.user.id, locale: "nl" });
      setCoreValues(vals);
      setLoading(false);
    })();
  }, [nav]);

  const isAdmin = (profile?.roles ?? []).includes("admin");

  async function saveProfile() {
    setSaving(true);
    try {
      const payload = {
        full_name: draft.full_name,
        bio: draft.bio,
        locale: draft.locale,
        timezone: draft.timezone,
        avatar_url: draft.avatar_url,
        focus_areas: draft.focus_areas,
        core_values: draft.core_values,
        current_mood: draft.current_mood,
      };
      const updatedProfile = await updateMyProfile(payload);
      setProfile(updatedProfile as Profile);
      setDraft(updatedProfile);
      showSuccess("Profiel opgeslagen!");
    } catch (error: any) {
      showError(`Opslaan mislukt: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    try {
      const url = await uploadAvatar(file, profile.id);
      setDraft(prev => ({ ...prev, avatar_url: url }));
    } finally {
      setUploading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    nav("/login");
  }

  const handleMultiSelectToggle = (field: 'focus_areas' | 'core_values', value: string) => {
    const currentValues = draft[field] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    setDraft(prev => ({ ...prev, [field]: newValues }));
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  const focusOptions = [
    { id: 'love', label: 'Liefde & Relaties' },
    { id: 'career', label: 'Carrière & Werk' },
    { id: 'growth', label: 'Persoonlijke Groei' },
    { id: 'health', label: 'Gezondheid & Welzijn' },
    { id: 'spirituality', label: 'Spiritualiteit' },
    { id: 'finance', label: 'Financiën' },
  ];

  return (
    <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-serif text-amber-200">{t('profile.title')}</h1>
        <div className="flex items-center gap-3">
          {isAdmin && <Link to="/admin"><Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/40">{t('header.admin')}</Button></Link>}
          <Button variant="ghost" onClick={logout} className="text-stone-300 hover:text-amber-200"><LogOut className="h-4 w-4 mr-1" /> {t('header.logout')}</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-stone-950/60 border-white/10">
            <CardHeader><CardTitle className="text-amber-200">{t('profile.account')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-stone-900">
                  {draft.avatar_url && <img src={draft.avatar_url} alt="Avatar" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
                  {uploading && <div className="text-xs text-stone-400 mt-1"><UploadCloud className="inline h-3 w-3 mr-1" /> Uploaden...</div>}
                </div>
              </div>
              <div>
                <label className="text-sm text-stone-400">{t('profile.name')}</label>
                <Input value={draft.full_name ?? ""} placeholder="Volledige naam" onChange={(e) => setDraft({ ...draft, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm text-stone-400">{t('profile.email')}</label>
                <Input value={userEmail ?? ""} disabled />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-stone-950/60 border-white/10">
            <CardHeader><CardTitle className="text-amber-200 flex items-center gap-2"><Sparkles className="h-5 w-5" /> Spiritueel Profiel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-stone-400">Focusgebieden</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {focusOptions.map(opt => (
                    <Badge key={opt.id} onClick={() => handleMultiSelectToggle('focus_areas', opt.id)} variant={draft.focus_areas?.includes(opt.id) ? 'default' : 'outline'} className="cursor-pointer">{opt.label}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-stone-400">Kernwaarden</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {coreValues.map(val => (
                    <Badge key={val.id} onClick={() => handleMultiSelectToggle('core_values', val.id)} variant={draft.core_values?.includes(val.id) ? 'default' : 'outline'} className="cursor-pointer">{val.name_nl}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm text-stone-400">Huidige stemming</label>
                <Input value={draft.current_mood ?? ""} placeholder="bv. hoopvol, onzeker..." onChange={(e) => setDraft({ ...draft, current_mood: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <StatisticsPanel />
          <Card className="bg-stone-950/60 border-white/10">
            <CardHeader><CardTitle className="text-amber-200">{t('profile.sessions')}</CardTitle></CardHeader>
            <CardContent>
              <RecentSessions />
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-20">
        <Button onClick={saveProfile} disabled={saving} size="lg" className="bg-amber-700 hover:bg-amber-600 text-white shadow-lg">
          {saving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}