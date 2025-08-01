import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import SwipeCard from "@/components/SwipeCard";
import MatchModal from "@/components/MatchModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, X, Star, RotateCcw } from "lucide-react";

export default function Swipe() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMatch, setShowMatch] = useState(false);
  const [matchData, setMatchData] = useState<any>(null);

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery<any[]>({
    queryKey: ["/api/swipe/candidates"],
    enabled: isAuthenticated,
  });

  const swipeMutation = useMutation({
    mutationFn: async ({ swipedId, action }: { swipedId: string; action: string }) => {
      const response = await apiRequest("/api/swipe", "POST", { swipedId, action });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.match) {
        setMatchData(data.match);
        setShowMatch(true);
      }
      setCurrentIndex(prev => prev + 1);
      
      // Refresh candidates when running low
      if (currentIndex >= candidates.length - 2) {
        queryClient.invalidateQueries({ queryKey: ["/api/swipe/candidates"] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to process swipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSwipe = (action: string) => {
    const currentCandidate = candidates[currentIndex];
    if (currentCandidate) {
      swipeMutation.mutate({ swipedId: currentCandidate.id, action });
    }
  };

  const handleUndo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || candidatesLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentCandidate = candidates[currentIndex];
  const hasMoreCandidates = currentIndex < candidates.length;

  return (
    <div className="min-h-screen bg-neutral">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Discover Your Perfect Roommate
          </h1>
          <p className="text-gray-600">
            Swipe right on profiles you like, left to pass. Find your compatible match!
          </p>
        </div>

        {hasMoreCandidates && currentCandidate ? (
          <div className="flex justify-center">
            <div className="relative">
              <SwipeCard 
                candidate={currentCandidate}
                onSwipe={handleSwipe}
              />
              
              {/* Action Buttons */}
              <div className="flex justify-center space-x-6 mt-8">
                <Button
                  onClick={() => handleSwipe('pass')}
                  disabled={swipeMutation.isPending}
                  className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  variant="outline"
                >
                  <X className="text-gray-500 w-6 h-6" />
                </Button>
                
                <Button
                  onClick={handleUndo}
                  disabled={currentIndex === 0 || swipeMutation.isPending}
                  className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                  variant="outline"
                >
                  <RotateCcw className="text-blue-500 w-6 h-6" />
                </Button>
                
                <Button
                  onClick={() => handleSwipe('super_like')}
                  disabled={swipeMutation.isPending}
                  className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                  variant="outline"
                >
                  <Star className="text-blue-500 w-6 h-6" />
                </Button>
                
                <Button
                  onClick={() => handleSwipe('like')}
                  disabled={swipeMutation.isPending}
                  className="w-14 h-14 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors shadow-lg"
                >
                  <Heart className="text-white w-6 h-6" />
                </Button>
              </div>
              
              {/* Progress Indicator */}
              <div className="text-center mt-6">
                <div className="text-sm text-gray-500">
                  {currentIndex + 1} of {candidates.length} profiles
                </div>
                <div className="w-64 mx-auto mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / candidates.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No More Profiles
              </h3>
              <p className="text-gray-600 mb-6">
                You've seen all available profiles in your area. Check back later for new matches!
              </p>
              <Button
                onClick={() => {
                  setCurrentIndex(0);
                  queryClient.invalidateQueries({ queryKey: ["/api/swipe/candidates"] });
                }}
                className="bg-primary hover:bg-primary-dark"
              >
                Refresh Profiles
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Modal */}
      {showMatch && matchData && (
        <MatchModal
          match={matchData}
          onClose={() => setShowMatch(false)}
          onMessage={() => {
            setShowMatch(false);
            // Navigate to messages
            window.location.href = `/messages/${matchData.id}`;
          }}
          onContinue={() => setShowMatch(false)}
        />
      )}
    </div>
  );
}
