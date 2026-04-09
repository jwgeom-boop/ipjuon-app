import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import ContractInfo from "./pages/ContractInfo";
import TabPlaceholder from "./pages/TabPlaceholder";
import Home from "./pages/Home";
import LoanMain from "./pages/LoanMain";
import LoanCalcStep1 from "./pages/LoanCalcStep1";
import LoanCalcStep2 from "./pages/LoanCalcStep2";
import LoanCalcStep3 from "./pages/LoanCalcStep3";
import LoanCalcResult from "./pages/LoanCalcResult";
import LoanBanks from "./pages/LoanBanks";
import LoanCostCalc from "./pages/LoanCostCalc";
import NotFound from "./pages/NotFound";

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
          <Route path="/loan/calc/step1" element={<LoanCalcStep1 />} />
          <Route path="/loan/calc/step2" element={<LoanCalcStep2 />} />
          <Route path="/loan/calc/step3" element={<LoanCalcStep3 />} />
          <Route path="/loan/calc/result" element={<LoanCalcResult />} />
          <Route path="/payment" element={<TabPlaceholder path="/payment" />} />
          <Route path="/my" element={<TabPlaceholder path="/my" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
