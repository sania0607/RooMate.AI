import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Star, 
  Clock, 
  Sparkles, 
  Coffee,
  Moon,
  Users,
  Home,
  Eye,
  TrendingUp,
  Smile,
  RotateCcw
} from "lucide-react";

export default function Matches() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: matches = [], isLoading: matchesLoading, refetch } = useQuery<any[]>({
    queryKey: ["/api/matches"],
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
        description: "Latest matches loaded",
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

  if (isLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-white font-medium">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-8 h-8 text-white" />
            <h1 className="text-4xl font-bold text-white">Your Matches</h1>
            <Heart className="w-8 h-8 text-white" />
          </div>
          <p className="text-white/90 text-lg mb-4">
            {matches.length} compatible roommates are waiting to connect with you!
          </p>
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex items-center space-x-2 text-white/80">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Perfect matches</span>
            </div>
            <div className="flex items-center space-x-2 text-white/80">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">High compatibility</span>
            </div>
          </div>
          
          {/* Refresh Button */}
          <div className="mt-4">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing || matchesLoading}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-6 py-2 rounded-full transition-all duration-200"
              variant="outline"
            >
              <RotateCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {matches.length === 0 ? (
          <Card className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="text-center py-16 px-8 relative">
              {/* Decorative Background Elements */}
              <div className="absolute top-6 right-6">
                <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute top-16 left-8">
                <div className="w-4 h-4 bg-purple-200 rounded-full opacity-60 animate-bounce delay-300"></div>
              </div>
              <div className="absolute bottom-16 right-12">
                <div className="w-3 h-3 bg-pink-200 rounded-full opacity-70 animate-pulse delay-700"></div>
              </div>
              <div className="absolute bottom-24 left-6">
                <Heart className="w-5 h-5 text-purple-300 opacity-50" />
              </div>

              {/* Enhanced Main Icon */}
              <div className="relative mb-8">
                <div className="w-28 h-28 bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Heart className="w-14 h-14 text-transparent bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text stroke-2" />
                </div>
                <div className="absolute -top-2 -right-3 w-10 h-10 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  <Sparkles className="w-5 h-5 text-orange-600" />
                </div>
                <div className="absolute -bottom-1 -left-3 w-8 h-8 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full flex items-center justify-center shadow-sm">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                No Matches Yet
              </h3>
              <p className="text-gray-600 mb-10 leading-relaxed text-lg">
                Start discovering compatible roommates in your area. Your perfect match is just a swipe away!
              </p>

              {/* Enhanced Action Buttons */}
              <div className="space-y-4">
                <Link href="/discover">
                  <Button className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white font-bold py-4 rounded-full text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Eye className="mr-3 w-5 h-5 relative z-10" />
                    <span className="relative z-10">Start Discovering</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full py-4 rounded-full text-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300">
                    <Sparkles className="mr-3 w-5 h-5" />
                    Complete Your Profile
                  </Button>
                </Link>
              </div>

              {/* Success Stats Preview */}
              <div className="mt-12 grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">500+</p>
                  <p className="text-xs text-gray-600">Active Users</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">92%</p>
                  <p className="text-xs text-gray-600">Match Rate</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Smile className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">4.9</p>
                  <p className="text-xs text-gray-600">User Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {matches.map((match: any) => {
              const otherUser = match.user1Id === match.currentUserId ? match.user2 : match.user1;
              const profile = otherUser?.profile;
              
              return (
                <Card key={match.id} className="bg-white/95 backdrop-blur-sm border-0 shadow-xl sm:shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden hover:scale-105 transition-all duration-300 group">
                  {/* Profile Image */}
                  <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-purple-200 to-pink-200">
                    <Avatar className="w-full h-full rounded-none">
                      <AvatarImage 
                        src={otherUser?.profileImageUrl} 
                        alt={otherUser?.name}
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <AvatarFallback className="w-full h-full text-5xl font-bold bg-gradient-to-br from-purple-200 to-pink-200 text-purple-700 rounded-none">
                        {otherUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Compatibility Badge */}
                    <Badge className="absolute top-4 right-4 bg-emerald-500 text-white border-0 px-3 py-1.5 text-sm font-bold rounded-full shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      {match.compatibilityScore ? `${Math.round(match.compatibilityScore)}%` : '95%'}
                    </Badge>

                    {/* Match Date */}
                    <Badge className="absolute top-4 left-4 bg-white/90 text-gray-700 border-0 px-3 py-1 text-xs font-medium rounded-full">
                      <Heart className="w-3 h-3 mr-1 text-pink-500" />
                      {new Date(match.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-6">
                    {/* Name & Location */}
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {otherUser?.name || 'Anonymous'}
                      </h3>
                      
                      {profile?.location && (
                        <div className="flex items-center justify-center text-gray-600 mb-2">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm font-medium">{profile.location}</span>
                        </div>
                      )}

                      {profile?.about && (
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">
                          {profile.about}
                        </p>
                      )}
                    </div>
                    
                    {/* Lifestyle Info */}
                    {profile?.lifestyle && (
                      <div className="grid grid-cols-2 gap-2 mb-6">
                        {(profile.lifestyle?.interests || profile.interests) && (
                          <div className="bg-purple-50 rounded-lg p-2 text-center">
                            <Coffee className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                            <p className="text-xs font-medium text-purple-800">Interests</p>
                            <p className="text-xs text-purple-600">{(profile.lifestyle?.interests || profile.interests)?.slice(0, 2).join(', ')}</p>
                          </div>
                        )}
                        
                        {profile.lifestyle.sleepTime && (
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <Moon className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                            <p className="text-xs font-medium text-blue-800">Sleep</p>
                            <p className="text-xs text-blue-600">{profile.lifestyle.sleepTime}</p>
                          </div>
                        )}
                        
                        {profile.lifestyle.socialLevel && (
                          <div className="bg-pink-50 rounded-lg p-2 text-center">
                            <Users className="w-4 h-4 text-pink-600 mx-auto mb-1" />
                            <p className="text-xs font-medium text-pink-800">Social</p>
                            <p className="text-xs text-pink-600 capitalize">{profile.lifestyle.socialLevel}</p>
                          </div>
                        )}
                        
                        {profile.lifestyle.cleanliness && (
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <Home className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <p className="text-xs font-medium text-emerald-800">Cleanliness</p>
                            <p className="text-xs text-emerald-600 capitalize">{profile.lifestyle.cleanliness}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="space-y-2 sm:space-y-3">
                      <Link href={`/messages/${match.id}`} className="block">
                        <Button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:shadow-lg transition-all hover:scale-105 text-sm sm:text-base">
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                          Start Chatting
                        </Button>
                      </Link>
                      <Button variant="outline" className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border-2 hover:bg-gray-50 text-sm sm:text-base">
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Bottom CTA */}
        {matches.length > 0 && (
          <div className="text-center mt-16">
            <Card className="max-w-lg mx-auto bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl">
              <CardContent className="py-12">
                <div className="relative mb-6">
                  <Sparkles className="w-16 h-16 text-pink-400 mx-auto" />
                  <div className="absolute -top-2 -right-2">
                    <Heart className="w-6 h-6 text-purple-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Keep Discovering
                </h3>
                <p className="text-gray-600 mb-8 text-lg leading-relaxed">
                  Find even more compatible roommates in your area and expand your connections.
                </p>
                <div className="space-y-4">
                  <Link href="/discover">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold py-4 rounded-2xl text-lg hover:shadow-lg transition-all hover:scale-105">
                      <Eye className="mr-2 w-5 h-5" />
                      Continue Discovering
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="outline" className="w-full py-4 rounded-2xl text-lg border-2">
                      <Smile className="mr-2 w-5 h-5" />
                      Update Preferences
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
