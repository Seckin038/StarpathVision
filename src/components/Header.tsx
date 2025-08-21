import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient"; // Added supabase import
import { useEffect, useState } from "react"; // Added useEffect and useState

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate(); // Initialize useNavigate
  const [isAdmin, setIsAdmin] = useState(false); // State to track admin status

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
            {isAdmin && ( // Conditionally render admin dashboard button
              <Link to="/admin">
                <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Button onClick={signOut} variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              Uitloggen
            </Button>
          </>
        ) : (
          <Link to="/login">
            <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <LogIn className="h-4 w-4 mr-2" />
              Inloggen
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;