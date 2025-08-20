import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { LogIn, LayoutDashboard, Sparkles } from "lucide-react";

const Header = () => {
  const { user } = useAuth();

  return (
    <header className="relative z-20 max-w-4xl mx-auto flex justify-between items-center py-4 px-4 font-serif">
      <Link to="/" className="text-2xl font-bold text-amber-200 tracking-wider flex items-center gap-2">
        <Sparkles className="h-6 w-6" />
        Divinatio
      </Link>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        {user ? (
          <Link to="/dashboard">
            <Button variant="outline" className="border-amber-800 text-amber-300 hover:bg-amber-900/50 hover:text-amber-200">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
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