import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Lotes from "./pages/Lotes";
import LoteForm from "./pages/LoteForm";
import LoteDetails from "./pages/LoteDetails";
import Buscar from "./pages/Buscar";
import Logs from "./pages/Logs";
import PoliticaPrivacidade from "./pages/PoliticaPrivacidade";
import MeusDados from "./pages/MeusDados";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/politica-privacidade" element={<PoliticaPrivacidade />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lotes"
            element={
              <ProtectedRoute>
                <Lotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lote/novo"
            element={
              <ProtectedRoute requireAdmin>
                <LoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lote/:id"
            element={
              <ProtectedRoute requireAdmin>
                <LoteForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/lote-detalhes/:id"
            element={
              <ProtectedRoute>
                <LoteDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buscar"
            element={
              <ProtectedRoute>
                <Buscar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute requireAdmin>
                <Logs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meus-dados"
            element={
              <ProtectedRoute>
                <MeusDados />
              </ProtectedRoute>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
