import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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

  return (
    <header className="relative z-20 max-w-4xl mx-auto flex justify-between items-center py-4 px-4 font-serif">
      <Link to="/" className="text-2xl font-bold text-amber-200 tracking-wider flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        Starpathvision
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {user ? (
          <>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {t('header.admin')}
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                {t('header.dashboard')}
              </Button>
            </Link>
            <Button onClick={signOut} variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              {t('header.logout')}
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <LogIn className="h-4 w-4 mr-2" />
              {t('header.login')}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;