import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./shell/AdminLayout";
import RequireRole from "./shell/RequireRole";
import AdminCards from "./cards/AdminCards";
import AdminPersonas from "./personas/AdminPersonas";
import AdminTranslations from "./translations/AdminTranslations";
import AdminAudit from "./audit/AdminAudit";
import AdminSpreads from "./spreads/AdminSpreads";
import AdminUsers from "./users/AdminUsers";
import AdminFeatures from "./features/AdminFeatures";

export default function AdminRoutes() {
  return (
    <RequireRole roles={["admin","editor"]}>
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Navigate to="spreads" replace />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="personas" element={<AdminPersonas />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="spreads" element={<AdminSpreads />} />
          <Route path="users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
          <Route path="features" element={<RequireRole roles={["admin"]}><AdminFeatures /></RequireRole>} />
        </Routes>
      </AdminLayout>
    </RequireRole>
  );
}