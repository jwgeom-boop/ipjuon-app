import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import ContractInfo from "./pages/ContractInfo";
import Home from "./pages/Home";
import LoanMain from "./pages/LoanMain";
import LoanCalcDiagnosis from "./pages/LoanCalcDiagnosis";
import LoanBanks from "./pages/LoanBanks";
import LoanBankDetail from "./pages/LoanBankDetail";
import LoanBanksAfterConsent from "./pages/LoanBanksAfterConsent";
import LoanCostCalc from "./pages/LoanCostCalc";
import Payment from "./pages/Payment";
import MyPage from "./pages/MyPage";
import Partners from "./pages/Partners";
import Notices from "./pages/Notices";
import NotFound from "./pages/NotFound";
import ConsultationDashboard from "./pages/ConsultationDashboard";
import MyConsultations from "./pages/MyConsultations";
import MyConsultationDetail from "./pages/MyConsultationDetail";
import MyConsultationRepayment from "./pages/MyConsultationRepayment";
import Notifications from "./pages/Notifications";
import ComplexInfo from "./pages/ComplexInfo";
import { RouteTitle } from "./components/RouteTitle";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouteTitle />
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/contract-info" element={<ContractInfo />} />
          <Route path="/home" element={<Home />} />
          <Route path="/loan" element={<LoanMain />} />
          <Route path="/loan/calc/step1" element={<LoanCalcDiagnosis />} />
          <Route path="/loan/banks" element={<LoanBanks />} />
          <Route path="/loan/banks-after" element={<LoanBanksAfterConsent />} />
          <Route path="/loan/banks/:bankName" element={<LoanBankDetail />} />
          <Route path="/loan/cost-calc" element={<LoanCostCalc />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/my/consultations" element={<MyConsultations />} />
          <Route path="/my/consultations/:id" element={<MyConsultationDetail />} />
          <Route path="/my/consultations/:id/repayment" element={<MyConsultationRepayment />} />
          <Route path="/my/partners" element={<Partners />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/complex-info" element={<ComplexInfo />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/admin/consultations" element={<ConsultationDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
