import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import DealsListPage from "./pages/DealsListPage";
import CreateDeal from "./pages/CreateDeal";
import CoreDealTeam from "./pages/CoreDealTeam";
import SelectCategories from "./pages/SelectCategories";
import DueDiligenceChecklist from "./pages/DueDiligenceChecklist";
import DealDashboard from "./pages/DealDashboard";
import ExternalDealDashboard from "./pages/ExternalDealDashboard";
import NotFound from "./pages/NotFound";
import NewIntake from "./pages/onboarding/NewIntake";
import IntakeCategories from "./pages/onboarding/IntakeCategories";
import SendRequest from "./pages/onboarding/SendRequest";
import IntakeReview from "./pages/onboarding/IntakeReview";
import AccessRequest from "./pages/respond/AccessRequest";
import RespondentDashboard from "./pages/respond/RespondentDashboard";
import CategoryPart1 from "./pages/respond/CategoryPart1";
import CategoryPart2 from "./pages/respond/CategoryPart2";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="unisyn-theme">
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
            <Route path="/deals/:id/categories" element={<SelectCategories />} />
            <Route path="/deals/:id/checklist" element={<DueDiligenceChecklist />} />
            <Route path="/deals/:id/dashboard" element={<DealDashboard />} />
            <Route path="/external/deals/:dealId/dashboard" element={<ExternalDealDashboard />} />

            {/* Advisor onboarding flow */}
            <Route path="/onboarding/new" element={<NewIntake />} />
            <Route path="/onboarding/:intakeId/profile" element={<NewIntake />} />
            <Route path="/onboarding/:intakeId/categories" element={<IntakeCategories />} />
            <Route path="/onboarding/:intakeId/send" element={<SendRequest />} />
            <Route path="/onboarding/:intakeId/review" element={<IntakeReview />} />

            {/* Respondent portal (no auth) */}
            <Route path="/respond" element={<AccessRequest />} />
            <Route path="/respond/:intakeId" element={<RespondentDashboard />} />
            <Route path="/respond/:intakeId/category/:categoryCode/part-1" element={<CategoryPart1 />} />
            <Route path="/respond/:intakeId/category/:categoryCode/part-2" element={<CategoryPart2 />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
