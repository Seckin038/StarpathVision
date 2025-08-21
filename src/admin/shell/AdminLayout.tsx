import { Link, NavLink, Outlet } from "react-router-dom";

export default function AdminLayout({ children }: any) {
  const link = (to:string, label:string) => (
    <NavLink to={to} className={({isActive}) =>
      `px-3 py-2 rounded-lg ${isActive ? "bg-amber-700 text-white" : "text-stone-200 hover:bg-stone-800"}`
    }>{label}</NavLink>
  );
  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr] bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-stone-300 hover:text-white">← Terug</Link>
        <h1 className="font-serif text-xl">Admin</h1>
        <div className="ml-auto flex gap-2">
          {link("/admin/cards","Cards")}
          {link("/admin/personas","Personas")}
          {link("/admin/translations","Translations")}
          {link("/admin/audit","Audit")}
          {link("/admin/spreads","Spreads")} {/* NEW */}
        </div>
      </header>
      <main className="p-4 max-w-7xl mx-auto w-full">
        {children ?? <Outlet />}
      </main>
    </div>
  );
}