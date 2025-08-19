import { Outlet } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

const MainLayout = () => {
  return (
    <>
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </>
  );
};

export default MainLayout;