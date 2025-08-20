import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import "./i18n.ts"; // Import i18n configuration
import { PersonaProvider } from "./contexts/PersonaContext.tsx";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PersonaProvider>
      <App />
    </PersonaProvider>
  </React.StrictMode>
);