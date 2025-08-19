import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import TarotReading from "./pages/TarotReading";
import CoffeeReading from "./pages/CoffeeReading";
import CoffeeReadingWithUpload from "./pages/CoffeeReadingWithUpload";
import NumerologyReading from "./pages/NumerologyReading";
import Archive from "./pages/Archive";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/readings/tarot/:spread" element={<TarotReading />} />
          <Route path="/readings/coffee" element={<CoffeeReading />} />
          <Route path="/readings/coffee/upload" element={<CoffeeReadingWithUpload />} />
          <Route path="/readings/numerology" element={<NumerologyReading />} />
          <Route path="/archive" element={<Archive />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;