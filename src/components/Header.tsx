import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (!error && profile?.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="relative max-w-6xl mx-auto flex justify-between items-center py-4 px-4 font-serif">
      <Link to="/" className="text-2xl font-bold text-amber-200 tracking-wider flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        Starpathvision
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        {user ? (
          <>
            <Link to="/profile" className="px-3 py-2 rounded-md text-sm font-medium text-amber-200 hover:text-amber-100 bg-stone-800/50 hover:bg-stone-700/80 transition-colors">
              {t('header.myProfile')}
            </Link>
            {isAdmin && (
              <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-amber-200 hover:text-amber-100 bg-stone-800/50 hover:bg-stone-700/80 transition-colors">
                {t('header.admin')}
              </Link>
            )}
            <Link to="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-amber-200 hover:text-amber-100 bg-stone-800/50 hover:bg-stone-700/80 transition-colors">
              {t('header.dashboard')}
            </Link>
            <Button onClick={handleSignOut} variant="ghost" className="px-3 py-2 h-auto rounded-md text-sm font-medium text-amber-200 hover:text-amber-100 bg-stone-800/50 hover:bg-stone-700/80 transition-colors">
              {t('header.logout')}
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              {t('header.login')}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;