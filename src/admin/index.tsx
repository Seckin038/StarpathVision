import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./shell/AdminLayout";
import RequireRole from "./shell/RequireRole";
import AdminCards from "./cards/AdminCards";
import AdminPersonas from "./personas/AdminPersonas";
import AdminTranslations from "./translations/AdminTranslations";
import AdminAudit from "./audit/AdminAudit";
import AdminSpreads from "./spreads/AdminSpreads"; // NEW

export default function AdminRoutes() {
  return (
    <RequireRole roles={["admin","editor","moderator"]}>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="cards" replace />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="personas" element={<AdminPersonas />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="spreads" element={<AdminSpreads />} /> {/* NEW */}
        </Routes>
      </AdminLayout>
    </RequireRole>
  );
}