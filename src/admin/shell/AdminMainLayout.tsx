import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";
import SiteBackground from "@/components/SiteBackground";

const AdminMainLayout = () => {
  const { t } = useTranslation();

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
            <Link to="/admin" className="font-serif text-lg mr-4">{t('admin:home.title')}</Link>
            <div className="flex gap-1 flex-wrap">
              {link("/admin/spreads", t('admin:nav.spreads'))}
              {link("/admin/cards", t('admin:nav.cards'))}
              {link("/admin/personas", t('admin:nav.personas'))}
              {link("/admin/translations", t('admin:nav.translations'))}
              {link("/admin/users", t('admin:nav.users'))}
              {link("/admin/features", t('admin:nav.features'))}
              {link("/admin/audit", t('admin:nav.audit'))}
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