import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Admin from "@/pages/Admin";
import Assignment from "@/pages/Assignment";
import Auftrag from "@/pages/Auftrag";
import AppointmentBooking from "@/pages/AppointmentBooking";
import ContractForm from "@/pages/ContractForm";
import NotFound from "@/pages/NotFound";
import { SMSProvider } from "@/context/SMSContext";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <AuthProvider>
      <SMSProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/assignment/:assignmentUrl" element={<Assignment />} />
            <Route path="/auftrag/:auftragsnummer" element={<Auftrag />} />
            <Route path="/appointment-booking/:token" element={<AppointmentBooking />} />
            <Route path="/contract-form" element={<ContractForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </SMSProvider>
    </AuthProvider>
  );
}

export default App;
