import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SiteBackground from "@/components/SiteBackground";

const AdminMainLayout = () => {
  const { t } = useTranslation('admin');

  const link = (to: string, label: string) => (
    <NavLink 
      to={to} 
      className={({ isActive }) =>
        `px-3 py-2 rounded-lg text-sm ${isActive ? "bg-amber-700 text-white" : "text-stone-200 hover:bg-stone-800"}`
      }
    >
      {label}
    </NavLink>
  );

  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-100">
      <SiteBackground />
      <div className="relative z-10">
        <Header />
        <nav className="border-b border-t border-stone-800 bg-stone-950/50 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <Link to="/admin" className="font-serif text-lg mr-4">{t('home.title')}</Link>
            <div className="flex gap-1 flex-wrap">
              {link("/admin/spreads", t('nav.spreads'))}
              {link("/admin/cards", t('nav.cards'))}
              {link("/admin/personas", t('nav.personas'))}
              {link("/admin/translations", t('nav.translations'))}
              {link("/admin/users", t('nav.users'))}
              {link("/admin/features", t('nav.features'))}
              {link("/admin/audit", t('nav.audit'))}
            </div>
          </div>
        </nav>
        <main className="p-4 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminMainLayout;