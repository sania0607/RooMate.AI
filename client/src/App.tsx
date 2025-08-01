import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Heart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { omnidimService } from "@/services/omnidimService";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Profile from "@/pages/Profile";
import VoiceProfileSetup from "@/pages/VoiceProfileSetup";
import Swipe from "@/pages/Swipe";
import Discover from "@/pages/Discover";
import Matches from "@/pages/Matches";
import Messages from "@/pages/Messages";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import Notifications from "@/pages/Notifications";
import RoomTour from "@/pages/RoomTour";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="text-white w-8 h-8" />
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/profile" component={Profile} />
            <Route path="/voice-setup" component={VoiceProfileSetup} />
            <Route path="/swipe" component={Swipe} />
          <Route path="/discover" component={Discover} />
            <Route path="/matches" component={Matches} />
            <Route path="/messages/:matchId?" component={Messages} />
            <Route path="/notifications" component={Notifications} />
            <Route path="/room-tour" component={RoomTour} />
          </>
        )}
        {/* Admin routes available regardless of user authentication */}
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  useEffect(() => {
    // Initialize Omnidim service when app starts
    omnidimService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
