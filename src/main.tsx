import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./globals.css";
import "./i18n.ts";
import { PersonaProvider } from "./contexts/PersonaContext.tsx";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Loader2 } from "lucide-react";

const FullPageLoader = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
  </div>
);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Suspense fallback={<FullPageLoader />}>
      <BrowserRouter>
        <AuthProvider>
          <PersonaProvider>
            <App />
          </PersonaProvider>
        </AuthProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);