import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./shell/AdminLayout.tsx";
import RequireRole from "./shell/RequireRole.tsx";
import AdminCards from "./cards/AdminCards.tsx";
import AdminPersonas from "./personas/AdminPersonas.tsx";
import AdminTranslations from "./translations/AdminTranslations.tsx";
import AdminAudit from "./audit/AdminAudit.tsx";
import AdminSpreads from "./spreads/AdminSpreads.tsx"; // NEW

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