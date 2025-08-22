import { Link, NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminLayout({ children }: any) {
  const { t } = useTranslation();

  const link = (to: string, label: string) => (
    <NavLink to={to} className={({ isActive }) =>
      `px-3 py-2 rounded-lg ${isActive ? "bg-amber-700 text-white" : "text-stone-200 hover:bg-stone-800"}`
    }>{label}</NavLink>
  );

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-stone-300 hover:text-white">{t('admin.backToSite')}</Link>
        <h1 className="font-serif text-xl">{t('admin.home.title')}</h1>
        <div className="ml-auto flex gap-2 flex-wrap">
          {link("/admin/spreads", t('admin.nav.spreads'))}
          {link("/admin/cards", t('admin.nav.cards'))}
          {link("/admin/personas", t('admin.nav.personas'))}
          {link("/admin/translations", t('admin.nav.translations'))}
          {link("/admin/users", t('admin.nav.users'))}
          {link("/admin/features", t('admin.nav.features'))}
          {link("/admin/audit", t('admin.nav.audit'))}
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto w-full">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}