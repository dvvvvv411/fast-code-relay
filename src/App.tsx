
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SMSProvider } from "@/context/SMSContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Assignment from "./pages/Assignment";
import Auftrag from "./pages/Auftrag";
import Admin from "./pages/Admin";
import ContractForm from "./pages/ContractForm";
import ContractSuccess from "./pages/ContractSuccess";
import AppointmentBooking from "./pages/AppointmentBooking";
import UserDashboard from "./pages/UserDashboard";
import AssignmentDetail from "./pages/AssignmentDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SMSProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/assignment/:assignmentUrl" element={<Assignment />} />
              <Route path="/auftrag/:auftragId" element={<Auftrag />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/contract-form" element={<ContractForm />} />
              <Route path="/contract-success" element={<ContractSuccess />} />
              <Route path="/appointment-booking" element={<AppointmentBooking />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/assignment-detail/:assignmentUrl" element={<AssignmentDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </SMSProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
