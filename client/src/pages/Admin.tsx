import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Users, 
  Heart, 
  MessageCircle, 
  Flag,
  Search,
  LogOut,
  AlertTriangle,
  Mail,
  MapPin,
  AlertCircle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagDescription, setFlagDescription] = useState("");
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check admin authentication
  useEffect(() => {
    const validateAdminAccess = async () => {
      const adminSession = localStorage.getItem("adminSession");
      if (!adminSession) {
        setLocation("/admin/login");
        return;
      }

      try {
        const session = JSON.parse(adminSession);
        if (!session.adminId || !session.loginTime) {
          localStorage.removeItem("adminSession");
          setLocation("/admin/login");
          return;
        }

        // Check if session is not older than 8 hours
        const loginTime = new Date(session.loginTime);
        const now = new Date();
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff > 8) {
          localStorage.removeItem("adminSession");
          toast({
            title: "Session Expired",
            description: "Your admin session has expired. Please login again.",
            variant: "destructive",
          });
          setLocation("/admin/login");
          return;
        }

        // Server-side session validation
        try {
          const adminAuthHeaders: Record<string, string> = adminSession ? { Authorization: `Bearer ${adminSession}` } : {};
          const response = await fetch("/api/admin/validate", {
            headers: adminAuthHeaders,
          });
          
          if (!response.ok) {
            localStorage.removeItem("adminSession");
            toast({
              title: "Access Denied",
              description: "Invalid admin session. Please login again.",
              variant: "destructive",
            });
            setLocation("/admin/login");
            return;
          }
        } catch (validationError) {
          localStorage.removeItem("adminSession");
          setLocation("/admin/login");
          return;
        }

        setIsAdminAuthenticated(true);
      } catch (error) {
        localStorage.removeItem("adminSession");
        setLocation("/admin/login");
      }
    };

    validateAdminAccess();
  }, [setLocation, toast]);

  // Get admin session for authorization header
  const getAdminAuthHeaders = (): Record<string, string> => {
    const adminSession = localStorage.getItem("adminSession");
    return adminSession ? { Authorization: `Bearer ${adminSession}` } : {};
  };

  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdminAuthenticated,
    refetchInterval: 60000, // Refetch every minute
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdminAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    queryFn: async () => {
      const response = await fetch("/api/admin/users", {
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const flagUserMutation = useMutation({
    mutationFn: async ({ userId, reason, description }: { userId: string; reason: string; description: string }) => {
      const authHeaders = getAdminAuthHeaders();
      const response = await fetch("/api/admin/flag-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({ userId, reason, description }),
      });
      if (!response.ok) throw new Error("Failed to flag user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Flagged",
        description: "User has been flagged for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setFlagReason("");
      setFlagDescription("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to flag user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: getAdminAuthHeaders(),
      });
    },
    onSuccess: () => {
      localStorage.removeItem("adminSession");
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      setLocation("/admin/login");
    },
  });

  // If not authenticated as admin, don't render anything
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">Authenticating...</div>
        </div>
      </div>
    );
  }

  const handleFlagUser = () => {
    if (selectedUser && flagReason) {
      flagUserMutation.mutate({
        userId: selectedUser.id,
        reason: flagReason,
        description: flagDescription,
      });
    }
  };

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = !searchTerm || 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (statsLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="text-white w-6 h-6 animate-pulse" />
          </div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">Loading Admin Panel...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Enhanced Header */}
      <div className="bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">RooMate.ai Administration Portal</p>
              </div>
            </div>
            <Button 
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              variant="outline"
              className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 shadow-sm"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Registered accounts</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Matches</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.successfulMatches || "0"}</p>
                  <p className="text-xs text-gray-500 mt-1">Successful connections</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.activeUsers || "0"}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently online</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Flagged Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.flaggedProfiles || "0"}</p>
                  <p className="text-xs text-gray-500 mt-1">Require attention</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center">
                  <Flag className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced User Management */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">User Management</CardTitle>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
                  data-testid="input-search-users"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria.</p>
                </div>
              ) : (
                filteredUsers.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center space-x-4">
                      <Avatar className="w-14 h-14 ring-2 ring-gray-100 ring-offset-2">
                        <AvatarImage src={user.profileImageUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                          {user.name?.[0] || user.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">
                          {user.name || user.username}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <Mail className="w-4 h-4 mr-1" />
                          {user.email || "No email provided"}
                        </div>
                        {user.city && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {user.city}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          Joined {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : "recently"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={user.isActive !== false ? "default" : "secondary"}
                        className={user.isActive !== false ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {user.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 shadow-sm"
                            data-testid={`button-flag-user-${user.id}`}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            Flag
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white border-0 shadow-2xl">
                          <DialogHeader className="border-b border-gray-100 pb-4">
                            <DialogTitle className="flex items-center text-lg">
                              <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                              Flag User
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                              <div className="flex">
                                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                  Flagging will mark this user for administrative review.
                                </div>
                              </div>
                            </div>
                            
                            <Select value={flagReason} onValueChange={setFlagReason}>
                              <SelectTrigger className="border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                                <SelectItem value="fake_profile">Fake Profile</SelectItem>
                                <SelectItem value="harassment">Harassment</SelectItem>
                                <SelectItem value="spam">Spam</SelectItem>
                                <SelectItem value="safety_concern">Safety Concern</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Textarea
                              placeholder="Additional details (optional)..."
                              value={flagDescription}
                              onChange={(e) => setFlagDescription(e.target.value)}
                              className="min-h-20 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            />
                            
                            <div className="flex justify-end space-x-3 pt-4">
                              <Button 
                                variant="outline" 
                                onClick={() => setSelectedUser(null)}
                                className="border-gray-200 hover:bg-gray-50"
                              >
                                Cancel
                              </Button>
                              <Button 
                                onClick={handleFlagUser}
                                disabled={!flagReason || flagUserMutation.isPending}
                                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
                                data-testid="button-confirm-flag-user"
                              >
                                {flagUserMutation.isPending ? "Flagging..." : "Flag User"}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}