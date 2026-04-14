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
import LoanCostCalc from "./pages/LoanCostCalc";
import Payment from "./pages/Payment";
import MyPage from "./pages/MyPage";
import Partners from "./pages/Partners";
import Notices from "./pages/Notices";
import NotFound from "./pages/NotFound";
import ConsultationDashboard from "./pages/ConsultationDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/contract-info" element={<ContractInfo />} />
          <Route path="/home" element={<Home />} />
          <Route path="/loan" element={<LoanMain />} />
          <Route path="/loan/calc/step1" element={<LoanCalcDiagnosis />} />
          <Route path="/loan/banks" element={<LoanBanks />} />
          <Route path="/loan/cost-calc" element={<LoanCostCalc />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/my/partners" element={<Partners />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/admin/consultations" element={<ConsultationDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
