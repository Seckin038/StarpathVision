import { Routes, Route } from "react-router-dom";
import AdminMainLayout from "./shell/AdminMainLayout";
import RequireRole from "./shell/RequireRole";
import AdminCards from "./cards/AdminCards";
import AdminPersonas from "./personas/AdminPersonas";
import AdminTranslations from "./translations/AdminTranslations";
import AdminAudit from "./audit/AdminAudit";
import AdminSpreads from "./spreads/AdminSpreads";
import AdminUsers from "./users/AdminUsers";
import AdminFeatures from "./features/AdminFeatures";
import AdminHome from "./pages/AdminHome";

export default function AdminRoutes() {
  return (
    <RequireRole roles={["admin","editor"]}>
      <Routes>
        <Route element={<AdminMainLayout />}>
          <Route path="/" element={<AdminHome />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="personas" element={<AdminPersonas />} />
          <Route path="translations" element={<AdminTranslations />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="spreads" element={<AdminSpreads />} />
          <Route path="users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
          <Route path="features" element={<RequireRole roles={["admin"]}><AdminFeatures /></RequireRole>} />
        </Route>
      </Routes>
    </RequireRole>
  );
}