
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SMSProvider } from "./context/SMSContext";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import Auftrag from "./pages/Auftrag";
import Assignment from "./pages/Assignment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <SMSProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auftrag" element={<Auftrag />} />
              <Route path="/auftrag/:id" element={<Auftrag />} />
              <Route path="/assignment/:assignmentUrl" element={<Assignment />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SMSProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
