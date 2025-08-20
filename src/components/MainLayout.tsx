import { Outlet } from "react-router-dom";
import Header from "./Header";
import MysticalBackground from "./MysticalBackground";

const MainLayout = () => {
  return (
    <div className="relative min-h-screen bg-stone-950 text-stone-200 p-4 font-serif">
      <MysticalBackground mode="particles+sigils" intensity="low" />
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