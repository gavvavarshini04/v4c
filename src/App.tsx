import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/i18n/LanguageContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { MapPin } from "lucide-react";
// Eagerly loaded: critical-path pages shown before auth
import Login from "./pages/Login";
import Register from "./pages/Register";
import ComplaintHeatmap from "./pages/ComplaintHeatmap";
import PublicDashboard from "./pages/PublicDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OfficerDashboard from "./pages/OfficerDashboard";
import CitizenDashboard from "./pages/CitizenDashboard";

// Components
import ChatBot from "@/components/ChatBot";

// Code-split all pages — only load what's needed
const Landing = lazy(() => import("./pages/Landing"));
const Profile = lazy(() => import("./pages/Profile"));
const SubmitComplaint = lazy(() => import("./pages/SubmitComplaint"));
const ComplaintDetail = lazy(() => import("./pages/ComplaintDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Minimal full-screen spinner shown while a page chunk loads
function PageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
          <MapPin className="h-5 w-5" /> Voice4City
        </div>
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Suspense fallback={<PageSkeleton />}>
                <div className="bg-slate-950 min-h-screen">
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenDashboard /></ProtectedRoute>} />
                    <Route path="/officer" element={<ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/submit" element={<ProtectedRoute><SubmitComplaint /></ProtectedRoute>} />
                    <Route path="/track" element={<ProtectedRoute><CitizenDashboard /></ProtectedRoute>} />
                    <Route path="/complaint/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
                    <Route path="/heatmap" element={<ProtectedRoute allowedRoles={['officer', 'admin']}><ComplaintHeatmap /></ProtectedRoute>} />
                    <Route path="/public" element={<ProtectedRoute allowedRoles={['officer', 'admin']}><PublicDashboard /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
                <ChatBot />
              </Suspense>
            </ErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
