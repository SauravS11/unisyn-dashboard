import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import DealsListPage from "./pages/DealsListPage";
import CreateDeal from "./pages/CreateDeal";
import CoreDealTeam from "./pages/CoreDealTeam";
import DueDiligenceChecklist from "./pages/DueDiligenceChecklist";
import DealDashboard from "./pages/DealDashboard";
import ExternalDealDashboard from "./pages/ExternalDealDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="animate-fade-in">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/deals" element={<DealsListPage />} />
            <Route path="/deals/create" element={<CreateDeal />} />
            <Route path="/deals/:id/edit" element={<CreateDeal />} />
            <Route path="/deals/:id/team" element={<CoreDealTeam />} />
            <Route path="/deals/:id/checklist" element={<DueDiligenceChecklist />} />
            <Route path="/deals/:id/dashboard" element={<DealDashboard />} />
            <Route path="/external/deals/:dealId/dashboard" element={<ExternalDealDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
