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
import DemoFlow from "./pages/demo/DemoFlow";
import WorkspaceSelect from "./pages/WorkspaceSelect";
import IncubatorWelcome from "./pages/incubator/IncubatorWelcome";
import ApplicationsList from "./pages/incubator/ApplicationsList";
import NewApplication from "./pages/incubator/NewApplication";
import ChecklistPreview from "./pages/incubator/ChecklistPreview";
import SendApplicationRequest from "./pages/incubator/SendApplicationRequest";
import ApplicationReview from "./pages/incubator/ApplicationReview";
import ApplicationAccess from "./pages/apply/ApplicationAccess";
import ApplicantHome from "./pages/apply/ApplicantHome";
import ApplicantSection from "./pages/apply/ApplicantSection";

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
            <Route path="/demo" element={<DemoFlow />} />
            <Route path="/auth" element={<Index />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/workspace" element={<WorkspaceSelect />} />
            <Route path="/deals" element={<DealsListPage />} />

            {/* Incubators & Accelerators — programme manager */}
            <Route path="/incubator" element={<IncubatorWelcome />} />
            <Route path="/incubator/applications" element={<ApplicationsList />} />
            <Route path="/incubator/applications/new" element={<NewApplication />} />
            <Route path="/incubator/applications/:applicationId/profile" element={<NewApplication />} />
            <Route path="/incubator/applications/:applicationId/checklist" element={<ChecklistPreview />} />
            <Route path="/incubator/applications/:applicationId/send" element={<SendApplicationRequest />} />
            <Route path="/incubator/applications/:applicationId/review" element={<ApplicationReview />} />

            {/* Applicant portal (no auth) */}
            <Route path="/apply" element={<ApplicationAccess />} />
            <Route path="/apply/:applicationId" element={<ApplicantHome />} />
            <Route path="/apply/:applicationId/section/:sectionCode" element={<ApplicantSection />} />
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
