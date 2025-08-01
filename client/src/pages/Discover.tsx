import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import UserProfileCard from "@/components/UserProfileCard";
import UserDetailModal from "@/components/UserDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Heart, 
  X, 
  Sparkles, 
  MessageCircle,
  Eye,
  Zap,
  RotateCcw
} from "lucide-react";

export default function Discover() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: candidates = [], isLoading: candidatesLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/discover/users"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Refreshed!",
        description: "Latest roommate profiles loaded",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };



  const messageMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      const response = await apiRequest("/api/messages/start", "POST", data);
      return response.json();
    },
    onSuccess: (response: any) => {
      toast({
        title: "Conversation Started!",
        description: "Redirecting to chat...",
        variant: "default",
      });
      // Invalidate matches query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      // Redirect to messages page immediately
      setTimeout(() => {
        setLocation(response.redirectTo || `/messages/${response.matchId}`);
      }, 500);
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
      } else {
        toast({
          title: "Failed to start conversation",
          description: error?.message || "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => window.location.href = "/api/login", 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleMessage = (userId: string) => {
    messageMutation.mutate({ userId });
  };

  const handleViewProfile = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalMessage = () => {
    if (selectedUser) {
      setIsModalOpen(false);
      handleMessage(selectedUser.id);
    }
  };

  if (isLoading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-medium">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Users are already filtered server-side for profile pictures
  const usersWithPhotos = candidates;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      <Navigation />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-white/10 rounded-full blur-xl animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white">Discover</h1>
            <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <p className="text-white/90 text-base sm:text-lg px-4">
            Connect with roommates who have completed their profiles
          </p>
          <div className="flex items-center justify-center space-x-4 sm:space-x-6 mt-3 sm:mt-4">
            <div className="flex items-center space-x-2 text-white/80">
              <Eye className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">{usersWithPhotos.length} active profiles</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <Zap className="w-4 h-4" />
              <span className="text-xs sm:text-sm font-medium">Ready to connect</span>
            </div>
          </div>
          
          {/* Refresh Button */}
          <div className="mt-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || candidatesLoading}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-6 py-2 rounded-full transition-all duration-200"
              variant="outline"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>



        {/* Grid Layout */}
        {usersWithPhotos.length === 0 ? (
          <Card className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="text-center py-16 px-8 relative">
              {/* Decorative Elements */}
              <div className="absolute top-6 right-6">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute top-12 left-8">
                <div className="w-3 h-3 bg-purple-300 rounded-full opacity-60"></div>
              </div>
              <div className="absolute bottom-12 right-8">
                <div className="w-2 h-2 bg-pink-300 rounded-full opacity-70"></div>
              </div>
              
              {/* Main Icon */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Heart className="w-12 h-12 text-gradient bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 text-orange-600" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                No Roommates Yet
              </h3>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                You're among the first users! Complete your profile with a photo to help other roommates find and connect with you.
              </p>

              {/* Enhanced Buttons */}
              <div className="space-y-4">
                <Link href="/profile">
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 rounded-full text-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                    <Sparkles className="mr-3 w-5 h-5" />
                    Complete Your Profile
                  </Button>
                </Link>
                <Link href="/matches">
                  <Button variant="outline" className="w-full py-4 rounded-full text-lg border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300">
                    <MessageCircle className="mr-3 w-5 h-5" />
                    View Your Matches
                  </Button>
                </Link>
              </div>

              {/* Tips Section */}
              <div className="mt-10 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Tips
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Add a friendly profile photo</p>
                  <p>• Fill out your lifestyle preferences</p>
                  <p>• Share what you're looking for in a roommate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {usersWithPhotos.map((candidate) => (
              <UserProfileCard
                key={candidate.id}
                profile={{...candidate.profile || candidate, compatibilityScore: candidate.compatibilityScore}}
                onMessage={() => handleMessage(candidate.id)}
                onViewProfile={() => handleViewProfile(candidate)}
              />
            ))}
          </div>
        )}

        {/* Profile Detail Modal */}
        <UserDetailModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onMessage={handleModalMessage}
        />
      </div>
    </div>
  );
}