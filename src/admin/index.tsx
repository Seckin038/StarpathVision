import { Routes, Route } from "react-router-dom";
import AdminMainLayout from "./shell/AdminMainLayout";
import RequireRole from "./shell/RequireRole";
import AdminCards from "./cards/AdminCards";
import AdminPersonas from "./personas/AdminPersonas";
import AdminAudit from "./audit/AdminAudit";
import AdminUsers from "./users/AdminUsers";
import AdminHome from "./pages/AdminHome";

export default function AdminRoutes() {
  return (
    <RequireRole roles={["admin","editor"]}>
      <Routes>
        <Route element={<AdminMainLayout />}>
          <Route path="/" element={<AdminHome />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="personas" element={<AdminPersonas />} />
          <Route path="audit" element={<AdminAudit />} />
          <Route path="users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
        </Route>
      </Routes>
    </RequireRole>
  );
}