import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import StudyPlans from "./pages/StudyPlans";
import Calendar from "./pages/Calendar";
import Progress from "./pages/Progress";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import AiCoach from "./pages/AiCoach";
import PeerRooms from "./pages/PeerRooms";
import Snapshots from "./pages/Snapshots";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<Auth />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/plans" element={<StudyPlans />} />
              <Route path="/dashboard/ai-coach" element={<AiCoach />} />
              <Route path="/dashboard/peer-rooms" element={<PeerRooms />} />
              <Route path="/dashboard/calendar" element={<Calendar />} />
              <Route path="/dashboard/progress" element={<Progress />} />
              <Route path="/dashboard/snapshots" element={<Snapshots />} />
              <Route path="/dashboard/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
