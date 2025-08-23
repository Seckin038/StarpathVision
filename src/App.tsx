import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import RequireAuth from "./components/RequireAuth";

import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import TarotChoice from "./pages/TarotChoice";
import TarotSpreadReading from "./pages/TarotSpreadReading";
import CoffeeReading from "./pages/CoffeeReading";
import CoffeeReadingWithUpload from "./pages/CoffeeReadingWithUpload";
import NumerologyReading from "./pages/NumerologyReading";
import DreamReading from "./pages/DreamReading";
import Archive from "./pages/Archive";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ForgotPasswordPage from "./pages/ForgotPassword";
import ProfilePage from "./pages/Profile";
import AdminRoutes from "./admin";
import ReadingDetailPage from "./pages/ReadingDetail";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        {/* Admin routes now use their own layout structure */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Main site uses the MainLayout */}
        <Route element={<MainLayout />}>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          
          {/* Public Daily Tarot */}
          <Route path="/readings/tarot/spread/ppf-3" element={<TarotSpreadReading />} />

          {/* --- PROTECTED ROUTES --- */}
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/archive" element={<RequireAuth><Archive /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/reading/:id" element={<RequireAuth><ReadingDetailPage /></RequireAuth>} />
          <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />
          <Route path="/pricing" element={<RequireAuth><PricingPage /></RequireAuth>} />
          
          {/* Protected Reading Routes */}
          <Route path="/readings/tarot" element={<RequireAuth><TarotChoice /></RequireAuth>} />
          <Route path="/readings/tarot/spread/:spread" element={<RequireAuth><TarotSpreadReading /></RequireAuth>} />
          <Route path="/readings/coffee" element={<RequireAuth><CoffeeReading /></RequireAuth>} />
          <Route path="/readings/coffee/upload" element={<RequireAuth><CoffeeReadingWithUpload /></RequireAuth>} />
          <Route path="/readings/numerology" element={<RequireAuth><NumerologyReading /></RequireAuth>} />
          <Route path="/readings/dream" element={<RequireAuth><DreamReading /></RequireAuth>} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;