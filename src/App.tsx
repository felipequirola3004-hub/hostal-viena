import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import Services from "./pages/Services";
import Gallery from "./pages/Gallery";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import PaymentResponse from "./pages/PaymentResponse";
import PaymentResponseAdmin from "./pages/PaymentResponseAdmin";
import PayRedirect from "./pages/PayRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/habitaciones" element={<Rooms />} />
              <Route path="/servicios" element={<Services />} />
              <Route path="/galeria" element={<Gallery />} />
              <Route path="/opiniones" element={<Reviews />} />
              <Route path="/payment-response" element={<PaymentResponse />} />
              <Route path="/payment-response-admin" element={<PaymentResponseAdmin />} />
              <Route path="/pay/:paymentId" element={<PayRedirect />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/admin" element={<Admin/>} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
