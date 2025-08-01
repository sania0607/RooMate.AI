import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { 
  Heart, 
  Users, 
  MessageCircle, 
  Settings, 
  Mic, 
  Zap, 
  Brain, 
  Eye, 
  Shield, 
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  Star,
  House,
  Camera,
  Filter,
  Bell,
  ChevronRight,
  ArrowRight,
  Target,
  Coffee,
  Palette
} from "lucide-react";

export default function Home() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    enabled: isAuthenticated,
  });

  const { data: matches } = useQuery<any[]>({
    queryKey: ["/api/matches"],
    enabled: isAuthenticated,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/user/stats"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const profileComplete = profile?.isComplete;
  const matchCount = stats?.matchCount || matches?.length || 0;
  const unreadMessages = stats?.unreadMessages || 0;
  const activeUsers = stats?.activeUsers || 2847;
  const compatibilityScore = stats?.compatibilityScore || 85;
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-8 text-white">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-16 w-16 border-4 border-white/20">
                    <AvatarImage src={profile?.profileImageUrl} />
                    <AvatarFallback className="bg-white/20 text-white text-lg">
                      {user?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-4xl font-bold">
                      {greeting}, {user?.name || 'there'}! ✨
                    </h1>
                    <p className="text-white/90 text-lg mt-1">
                      {profileComplete 
                        ? "Your journey to find the perfect roommate continues"
                        : "Let's build your amazing profile together"
                      }
                    </p>
                  </div>
                </div>
                
                {profileComplete && (
                  <div className="flex items-center space-x-6 mt-6">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="h-5 w-5" />
                      <span className="font-medium">{matchCount} matches</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span className="font-medium">95% compatibility</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span className="font-medium">Online now</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="hidden md:flex items-center space-x-4">
                <Button
                  onClick={() => window.location.href = "/api/logout"}
                  variant="ghost"
                  className="text-white border-white/30 hover:bg-white/20"
                >
                  Logout
                </Button>
                <Link href="/notifications">
                  <Button className="bg-white text-purple-600 hover:bg-white/90">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 animate-pulse"></div>
          <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-white/5 animate-pulse delay-1000"></div>
        </div>

        {/* Profile Completion Section */}
        {!profileComplete && (
          <Card className="mb-8 border-0 bg-gradient-to-r from-amber-100 via-orange-100 to-pink-100 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Target className="text-white w-8 h-8" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Complete Your Amazing Profile</h3>
                    <p className="text-gray-700 text-lg mt-1">
                      Unlock the full power of AI matching • Get 10x better roommate suggestions
                    </p>
                    <div className="flex items-center mt-3 space-x-4">
                      <div className="flex items-center space-x-2">
                        <Progress value={35} className="w-24 h-2" />
                        <span className="text-sm font-medium text-gray-600">35% Complete</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                        <Clock className="w-3 h-3 mr-1" />
                        5 min left
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Link href="/profile">
                    <Button variant="outline" className="border-2 border-purple-200 hover:bg-purple-50">
                      <Mic className="mr-2 w-4 h-4" />
                      Quick Voice Setup
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
                      <Sparkles className="mr-2 w-4 h-4" />
                      Complete Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modern Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{matchCount}</div>
                  <div className="text-purple-100 font-medium">Perfect Matches</div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Heart className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-purple-100 text-sm">
                {matchCount > 0 ? "+12% this week" : "Start swiping to get matches"}
              </div>
            </CardContent>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {activeUsers > 1000 ? `${(activeUsers / 1000).toFixed(1)}K` : activeUsers}
                  </div>
                  <div className="text-pink-100 font-medium">Active Users</div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Users className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-pink-100 text-sm">
                {activeUsers > 100 ? "+240 today" : "Growing community"}
              </div>
            </CardContent>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{unreadMessages}</div>
                  <div className="text-blue-100 font-medium">New Messages</div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageCircle className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-blue-100 text-sm">
                {unreadMessages > 0 ? `${unreadMessages} unread` : "All caught up!"}
              </div>
            </CardContent>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </Card>
          
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{compatibilityScore}%</div>
                  <div className="text-emerald-100 font-medium">Compatibility</div>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Star className="text-white w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 text-emerald-100 text-sm">
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>
                    {compatibilityScore >= 90 ? "Excellent match rate" : 
                     compatibilityScore >= 80 ? "Great compatibility" : 
                     "Complete profile for better matching"}
                  </span>
                </div>
              </div>
            </CardContent>
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full"></div>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Your Journey Continues</h2>
              <p className="text-gray-600 mt-2">Choose your next step to find the perfect roommate</p>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

            
            {/* Find Roommates Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Heart className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {matchCount} matches
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Find Your Match</h3>
                <p className="text-pink-100 mb-6 leading-relaxed">
                  Discover compatible roommates through AI-powered matching and start meaningful connections.
                </p>
                
                <Link href="/discover">
                  <Button className="w-full bg-white text-pink-600 hover:bg-pink-50 font-semibold py-3 rounded-xl transition-colors">
                    <Heart className="mr-2 w-4 h-4" />
                    Start Discovering
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* My Matches Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {matchCount} total
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Your Matches</h3>
                <p className="text-blue-100 mb-6 leading-relaxed">
                  View your compatible matches and start building relationships with potential roommates.
                </p>
                
                <Link href="/matches">
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-xl transition-colors">
                    <Users className="mr-2 w-4 h-4" />
                    View All Matches
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* Messages Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {unreadMessages > 0 ? `${unreadMessages} new` : "All read"}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Messages</h3>
                <p className="text-purple-100 mb-6 leading-relaxed">
                  Chat securely with your matches and plan your living arrangements together.
                </p>
                
                <Link href="/messages">
                  <Button className="w-full bg-white text-purple-600 hover:bg-purple-50 font-semibold py-3 rounded-xl transition-colors">
                    <MessageCircle className="mr-2 w-4 h-4" />
                    Open Conversations
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* Profile Settings Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Settings className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    {profileComplete ? "Complete" : "35%"}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Profile & Settings</h3>
                <p className="text-emerald-100 mb-6 leading-relaxed">
                  Customize your preferences, update your lifestyle details, and enhance your profile.
                </p>
                
                <Link href="/profile">
                  <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 rounded-xl transition-colors">
                    <Settings className="mr-2 w-4 h-4" />
                    Manage Profile
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* Voice Setup Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Mic className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    New
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Voice Setup</h3>
                <p className="text-orange-100 mb-6 leading-relaxed">
                  Use AI-powered voice input to quickly complete your profile in just minutes.
                </p>
                
                <Link href="/voice-setup">
                  <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 font-semibold py-3 rounded-xl transition-colors">
                    <Mic className="mr-2 w-4 h-4" />
                    Try Voice Setup
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* Room Tour Card */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <House className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    New
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Room Tour</h3>
                <p className="text-cyan-100 mb-6 leading-relaxed">
                  Explore available rooms with photos, rent details, and facilities. Find your perfect space.
                </p>
                
                <Link href="/room-tour">
                  <Button className="w-full bg-white text-cyan-600 hover:bg-cyan-50 font-semibold py-3 rounded-xl transition-colors">
                    <House className="mr-2 w-4 h-4" />
                    Browse Rooms
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>

            {/* Admin Panel Card - Only for admins */}
            <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Shield className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30">
                    Admin
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3">Admin Panel</h3>
                <p className="text-gray-100 mb-6 leading-relaxed">
                  Access administrative tools and manage the platform's users and content.
                </p>
                
                <Link href="/admin">
                  <Button className="w-full bg-white text-gray-800 hover:bg-gray-50 font-semibold py-3 rounded-xl transition-colors">
                    <Shield className="mr-2 w-4 h-4" />
                    Access Admin
                  </Button>
                </Link>
              </CardContent>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full"></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}