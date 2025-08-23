import React, { useEffect, useState } from "react";
import MysticalBackground from "@/components/MysticalBackground";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { uploadAvatar } from "@/lib/upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, UploadCloud, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import RecentSessions from "@/components/RecentSessions";
import StatisticsPanel from "@/components/StatisticsPanel";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  locale: string | null;
  timezone: string | null;
  roles: string[] | null;
  onboarding_done: boolean | null;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const nav = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) { nav("/login"); return; }
      setUserEmail(auth.user.email ?? null);

      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      
      const prof = p as Profile | null;
      setProfile(prof ?? null);
      setDraft(prof ?? { id: auth.user.id, locale: "nl" });
      setLoading(false);
    })();
  }, [nav]);

  const isAdmin = (profile?.roles ?? []).includes("admin");

  async function saveProfile() {
    if (!profile) return;
    setSaving(true);
    const payload = {
      full_name: draft.full_name ?? null,
      bio: draft.bio ?? null,
      locale: draft.locale ?? "nl",
      timezone: draft.timezone ?? null,
      avatar_url: draft.avatar_url ?? profile.avatar_url ?? null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", profile.id);
    setSaving(false);
    if (!error) setProfile({ ...profile, ...payload });
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

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <MysticalBackground />
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-serif text-amber-200">{t('profile.title')}</h1>
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <Link to="/admin" className="text-sm">
                <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/40">
                  {t('header.admin')}
                </Button>
              </Link>
            ) : null}
            <Button variant="ghost" onClick={logout} className="text-stone-300 hover:text-amber-200">
              <LogOut className="h-4 w-4 mr-1" /> {t('header.logout')}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-stone-950/60 border-white/10">
            <CardHeader>
              <CardTitle className="text-amber-200">{t('profile.account')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden border border-white/10 bg-stone-900">
                  {draft.avatar_url || profile?.avatar_url ? (
                    <img src={draft.avatar_url ?? (profile?.avatar_url as string)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={onAvatarChange} disabled={uploading} />
                  {uploading && <div className="text-xs text-stone-400 mt-1"><UploadCloud className="inline h-3 w-3 mr-1" /> Uploaden...</div>}
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400">{t('profile.name')}</label>
                <Input
                  value={draft.full_name ?? ""}
                  placeholder="Volledige naam"
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm text-stone-400">{t('profile.email')}</label>
                <Input value={userEmail ?? ""} disabled />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-stone-400">{t('profile.language')}</label>
                  <Select
                    value={draft.locale ?? "nl"}
                    onValueChange={(v) => setDraft({ ...draft, locale: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Kies taal" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="tr">Türkçe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-stone-400">{t('profile.timezone')}</label>
                  <Input
                    placeholder="Europe/Amsterdam"
                    value={draft.timezone ?? ""}
                    onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-stone-400">{t('profile.about')}</label>
                <Textarea
                  rows={4}
                  value={draft.bio ?? ""}
                  placeholder="Korte bio / intenties"
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {(profile?.roles ?? ["user"]).map((r) => (
                    <Badge key={r} variant="outline" className="border-amber-800 text-amber-300">{r}</Badge>
                  ))}
                </div>
                <Button onClick={saveProfile} disabled={saving} className="bg-amber-800 hover:bg-amber-700">
                  {saving ? (<><Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t('common.save')}</>) : (<><Save className="h-4 w-4 mr-1" /> {t('common.save')}</>)}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <StatisticsPanel />
            <Card className="bg-stone-950/60 border-white/10">
              <CardHeader><CardTitle className="text-amber-200">{t('profile.sessions')}</CardTitle></CardHeader>
              <CardContent>
                <RecentSessions />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}