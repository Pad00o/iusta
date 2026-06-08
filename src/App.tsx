import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { RequireAuth } from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import Storico from "./pages/Storico.tsx";
import Settings from "./pages/Settings.tsx";
import Modelli from "./pages/Modelli.tsx";
import Analytics from "./pages/Analytics.tsx";
import Confronta from "./pages/Confronta.tsx";
import Privacy from "./pages/Privacy.tsx";
import NotFound from "./pages/NotFound.tsx";
import SharedReport from "./pages/SharedReport.tsx";
import Login from "./pages/Login.tsx";
import Clienti from "./pages/Clienti.tsx";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/shared/:token" element={<SharedReport />} />
              <Route
                element={
                  <RequireAuth>
                    <AppLayout />
                  </RequireAuth>
                }
              >
                <Route path="/" element={<Index />} />
                <Route path="/storico" element={<Storico />} />
                <Route path="/modelli" element={<Modelli />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/confronta" element={<Confronta />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/clienti"
                  element={
                    <RequireAuth adminOnly>
                      <Clienti />
                    </RequireAuth>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
