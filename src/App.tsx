import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import MainLayout from "./components/MainLayout";

import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import TarotChoice from "./pages/TarotChoice";
import TarotSpreadReading from "./pages/TarotSpreadReading";
import TarotPickThree from "./pages/TarotPickThree";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<MainLayout />}>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/onboarding" element={<Onboarding />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
              <Route path="/archive" element={<RequireAuth><Archive /></RequireAuth>} />
              <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
              
              <Route path="/readings/tarot" element={<RequireAuth><TarotChoice /></RequireAuth>} />
              <Route path="/readings/tarot/spread/:spread" element={<TarotSpreadReading />} />
              <Route path="/readings/tarot/pick-three" element={<RequireAuth><TarotPickThree /></RequireAuth>} />
              <Route path="/readings/coffee" element={<CoffeeReading />} />
              <Route path="/readings/coffee/upload" element={<CoffeeReadingWithUpload />} />
              <Route path="/readings/numerology" element={<NumerologyReading />} />
              <Route path="/readings/dream" element={<DreamReading />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;