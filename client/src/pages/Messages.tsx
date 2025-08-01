import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageCircle, 
  Send, 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Star,
  MapPin,
  Clock
} from "lucide-react";

export default function Messages() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [match, params] = useRoute("/messages/:matchId?");
  const [newMessage, setNewMessage] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(params?.matchId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: matches = [], isLoading: matchesLoading } = useQuery<any[]>({
    queryKey: ["/api/matches"],
    enabled: isAuthenticated,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ["/api/matches", selectedMatch, "messages"],
    enabled: isAuthenticated && !!selectedMatch,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(`/api/matches/${selectedMatch}/messages`, "POST", { content });
      return response.json();
    },
    onSuccess: (newMessage) => {
      setNewMessage("");
      // The server now handles real-time broadcasting automatically
      queryClient.invalidateQueries({ queryKey: ["/api/matches", selectedMatch, "messages"] });
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
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection - persistent connection
  useEffect(() => {
    if (!isAuthenticated) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let wsHost = window.location.hostname;
    let wsPort = window.location.port;
    let wsUrl = '';
    if (wsPort) {
      wsUrl = `${protocol}//${wsHost}:${wsPort}/ws`;
    } else {
      wsUrl = `${protocol}//${wsHost}/ws`;
    }
    
    // Close existing connection if any
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connection established');
      // Join current match room if one is selected
      if (selectedMatch) {
        ws.send(JSON.stringify({
          type: 'join_match',
          matchId: selectedMatch
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.type === 'new_message') {
          // Real-time message received, refresh the messages for the specific match
          queryClient.invalidateQueries({ 
            queryKey: ["/api/matches", data.matchId, "messages"] 
          });
          
          // Show toast notification if message is for current match
          if (data.matchId === selectedMatch) {
            toast({
              title: "New message",
              description: "Received a new message",
              variant: "default",
            });
          }
        } else if (data.type === 'pong') {
          // Handle pong response for connection health
          console.log('WebSocket connection is healthy');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    // Set up ping interval for connection health
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping every 30 seconds

    ws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      
      // Attempt to reconnect after a delay if not intentionally closed
      if (event.code !== 1000 && isAuthenticated) {
        setTimeout(() => {
          console.log('Attempting to reconnect WebSocket...');
          // Re-run this effect to establish new connection
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      clearInterval(pingInterval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounting');
      }
    };
  }, [isAuthenticated, queryClient, toast]);

  // Handle match room changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && selectedMatch) {
      wsRef.current.send(JSON.stringify({
        type: 'join_match',
        matchId: selectedMatch
      }));
    }
  }, [selectedMatch]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-select match from URL parameter when matches are loaded
  useEffect(() => {
    if (params?.matchId && matches.length > 0) {
      const matchExists = matches.find(m => m.id === params.matchId);
      if (matchExists && selectedMatch !== params.matchId) {
        setSelectedMatch(params.matchId);
        console.log("Auto-selected match from URL:", params.matchId);
      }
    }
  }, [params?.matchId, matches, selectedMatch]);

  // Set selectedMatch from URL parameter immediately if available
  useEffect(() => {
    if (params?.matchId && !selectedMatch) {
      setSelectedMatch(params.matchId);
      console.log("Set selectedMatch from URL parameter:", params.matchId);
    }
  }, [params?.matchId, selectedMatch]);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedMatch) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading || matchesLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentMatch = matches.find((m: any) => m.id === selectedMatch);
  const otherUser = currentMatch ? 
    (currentMatch.user1Id !== user?.id ? currentMatch.user1 : currentMatch.user2) : null;
  
  // Debug log to help troubleshoot
  useEffect(() => {
    if (selectedMatch && currentMatch) {
      console.log("Selected match:", selectedMatch);
      console.log("Current match data:", currentMatch);
      console.log("Other user:", otherUser);
    }
  }, [selectedMatch, currentMatch, otherUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      <Navigation />
      
      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-40 h-40 bg-white/5 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          {/* Matches List */}
          <Card className="lg:col-span-1 bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-gray-900">Messages ({matches.length})</span>
                </div>
                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                  Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {matches.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Messages Yet</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Start conversations with your matches to find the perfect roommate arrangement.
                    </p>
                  </div>
                ) : (
                  matches.map((match: any) => {
                    const matchOtherUser = match.user1Id !== user?.id ? match.user1 : match.user2;
                    const isSelected = selectedMatch === match.id;
                    
                    return (
                      <div
                        key={match.id}
                        onClick={() => setSelectedMatch(match.id)}
                        className={`p-4 cursor-pointer transition-all duration-300 hover:bg-purple-50 ${
                          isSelected ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500' : 'border-b border-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
                              <AvatarImage src={matchOtherUser?.profileImageUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                                {(matchOtherUser?.name || matchOtherUser?.firstName || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-gray-900 truncate">
                                {matchOtherUser?.name || matchOtherUser?.firstName || 'User'}
                              </h4>
                              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-2 py-1">
                                <Star className="w-3 h-3 mr-1" />
                                {match.compatibilityScore || 78}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate mb-1">
                              {matchOtherUser?.profile?.location || 'Tap to start chatting'}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Matched {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : '2h ago'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            {selectedMatch && otherUser ? (
              <>
                {/* Chat Header */}
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMatch(null)}
                        className="lg:hidden hover:bg-purple-100 rounded-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                          <AvatarImage src={otherUser.profileImageUrl} />
                          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-semibold">
                            {(otherUser?.name || otherUser?.firstName || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">
                          {otherUser?.name || `${otherUser?.firstName || ''} ${otherUser?.lastName || ''}`.trim() || 'User'}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span>Active now</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        {currentMatch?.compatibilityScore || 78}% Match
                      </Badge>
                      <Button variant="outline" size="sm" className="border-purple-200 hover:bg-purple-50 rounded-xl">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageCircle className="w-12 h-12 text-purple-500" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Start the conversation!</h3>
                          <p className="text-gray-600 text-sm mb-6">
                            Say hello to {otherUser?.name || otherUser?.firstName || 'your match'} and break the ice 👋
                          </p>
                          <div className="max-w-md mx-auto p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl border border-purple-100/50">
                            <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                              💡 Conversation starters:
                            </h4>
                            <ul className="text-purple-800 text-sm space-y-2 text-left">
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                "Hi! I saw we matched - excited to learn more about you!"
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                "What made you swipe right on my profile?"
                              </li>
                              <li className="flex items-start">
                                <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                "Tell me about your ideal living situation"
                              </li>
                            </ul>
                          </div>
                        </div>
                      ) : (
                        messages.map((message: any) => {
                          const isOwn = message.senderId === user?.id;
                          
                          return (
                            <div
                              key={message.id}
                              className={`flex items-end space-x-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              {!isOwn && (
                                <Avatar className="w-8 h-8 mb-1">
                                  <AvatarImage src={otherUser?.profileImageUrl} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                                    {(otherUser?.name || otherUser?.firstName || 'U').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                isOwn 
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md' 
                                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                              }`}>
                                <p className="text-sm leading-relaxed">{message.content}</p>
                                <div className={`text-xs mt-2 ${
                                  isOwn ? 'text-purple-100' : 'text-gray-500'
                                }`}>
                                  {formatMessageTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </CardContent>

                {/* Message Input */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100/50 p-6">
                  <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message ${otherUser?.name || otherUser?.firstName || 'your match'}...`}
                        className="w-full py-4 px-6 bg-white border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-purple-200 resize-none transition-all duration-200"
                        disabled={sendMessageMutation.isPending}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                    >
                      {sendMessageMutation.isPending ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              /* No Chat Selected */
              <CardContent className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <MessageCircle className="w-16 h-16 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-md">
                    Choose a match from the sidebar to start chatting and find your perfect roommate arrangement.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
