import { Outlet } from "react-router-dom";
import Header from "./Header";
import SiteBackground from "./SiteBackground";

const MainLayout = () => {
  return (
    <div className="relative min-h-screen text-stone-200 p-4 font-serif">
      <SiteBackground mode="all" intensity="med" />
      <div className="relative z-10">
        <Header />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;