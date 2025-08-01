import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Phone, 
  PhoneCall, 
  Mic, 
  MicOff as PhoneOff, 
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle,
  Loader2,
  Volume2,
  MessageCircle
} from "lucide-react";

// Global window extension for Omnidim widget
declare global {
  interface Window {
    omnidim?: any;
    OMNIDIM_API_KEY?: string;
  }
}

interface OmnidimVoiceAssistantProps {
  onClose: () => void;
  onComplete?: (profileData: any) => void;
}

interface CallState {
  callId?: string;
  agentId?: string;
  status: 'idle' | 'creating-agent' | 'agent-ready' | 'calling' | 'in-call' | 'completed' | 'error';
  transcript?: string;
  error?: string;
}

export function OmnidimVoiceAssistant({ onClose, onComplete }: OmnidimVoiceAssistantProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [callState, setCallState] = useState<CallState>({ status: 'idle' });
  const [callDuration, setCallDuration] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const omnidimWidgetRef = useRef<any>(null);
  const [isWebCallActive, setIsWebCallActive] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  // Fetch API key from config endpoint
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setApiKey(config.VITE_OMNIDIM_API_KEY || '');
        console.log('API key loaded from config:', config.VITE_OMNIDIM_API_KEY ? 'Present' : 'Missing');
      } catch (error) {
        console.error('Failed to fetch API config:', error);
      }
    };
    fetchConfig();
  }, []);

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/omnidim/create-agent", "POST");
      return response.json();
    },
    onSuccess: (data) => {
      setCallState(prev => ({
        ...prev,
        status: 'agent-ready',
        agentId: data.agent.id
      }));
      toast({
        title: "Voice Assistant Ready",
        description: "Rooma is ready to help you set up your profile. Click 'Start Call' to begin!",
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      
      let errorMessage = 'Failed to create voice assistant. Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('Voice assistant creation error:', error);
      setCallState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      toast({
        title: "Setup Failed",
        description: "Failed to create voice assistant. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Start call mutation
  const startCallMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest("/api/omnidim/start-call", "POST", {
        agentId,
        phoneNumber: null // Web call
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCallState(prev => ({
        ...prev,
        status: 'in-call',
        callId: data.call.id
      }));
      setIsPolling(true);
      toast({
        title: "Call Started",
        description: "You're now connected with Rooma! She'll ask you questions to set up your profile.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      setCallState(prev => ({
        ...prev,
        status: 'error',
        error: 'Failed to start call. Please try again.'
      }));
      toast({
        title: "Call Failed",
        description: "Failed to start the voice call. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Process transcript mutation
  const processTranscriptMutation = useMutation({
    mutationFn: async ({ callId, transcript }: { callId: string; transcript: string }) => {
      const response = await apiRequest("/api/omnidim/process-transcript", "POST", {
        callId,
        transcript
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCallState(prev => ({
        ...prev,
        status: 'completed',
        profileData: data.profileData
      }));
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Setup Complete!",
        description: "Your conversation with Rooma has been processed and your profile has been automatically filled with your preferences!",
      });
      onComplete?.(data.profileData);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Processing Failed",
        description: "Failed to process your voice interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize Omnidim web widget for real audio calling
  useEffect(() => {
    // Load Omnidim widget script if not already loaded
    if (!window.omnidim && !document.querySelector('script[src*="omnidim"]')) {
      const script = document.createElement('script');
      script.src = 'https://widget.omnidim.io/embed.js';
      script.async = true;
      script.onload = () => {
        initializeOmnidimWidget();
      };
      document.head.appendChild(script);
    } else if (window.omnidim) {
      initializeOmnidimWidget();
    }
  }, []);

  const initializeOmnidimWidget = async () => {
    try {
      if (!window.omnidim) {
        console.log('Omnidim widget not available, loading...');
        return false;
      }

      if (!apiKey) {
        console.error('No API key available for Omnidim widget');
        throw new Error('OMNIDIM_API_KEY is required for voice calling');
      }

      console.log('Initializing Omnidim widget with API key');
      
      omnidimWidgetRef.current = await window.omnidim.init({
        apiKey: apiKey,
        mode: 'web-calling',
        enableAudio: true,
        enableVideo: false,
        autoConnect: false, // Manual connection for better control
        debug: true,
        config: {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          transcription: {
            enabled: true,
            realTime: true
          }
        }
      });
      
      console.log('Omnidim widget initialized successfully');
      
      // Set up event listeners
      omnidimWidgetRef.current.on('ready', () => {
        console.log('Omnidim widget is ready');
        toast({
          title: "Voice System Ready",
          description: "Rooma is ready to talk with you!",
        });
      });

      omnidimWidgetRef.current.on('callStart', () => {
        console.log('Omnidim call started');
        setIsWebCallActive(true);
        setCallState(prev => ({ ...prev, status: 'in-call' }));
        setCallDuration(0);
        toast({
          title: "🎙️ Connected to Rooma!",
          description: "Audio connection established. Rooma can now hear you and speak to you. Answer her questions naturally.",
        });
      });

      omnidimWidgetRef.current.on('callEnd', (result: any) => {
        console.log('Omnidim call ended with result:', result);
        setIsWebCallActive(false);
        setCallState(prev => ({ 
          ...prev, 
          status: 'completed', 
          transcript: result.transcript || result.conversation || ''
        }));
        
        // Process the transcript automatically
        const finalTranscript = result.transcript || result.conversation || result.summary || '';
        if (finalTranscript && finalTranscript.length > 50) {
          processTranscriptMutation.mutate({ 
            callId: 'web_call_' + Date.now(), 
            transcript: finalTranscript 
          });
        } else {
          toast({
            title: "Interview Complete",
            description: "Your profile setup is now complete!",
          });
          onComplete?.(result);
        }
      });

      omnidimWidgetRef.current.on('error', (error: any) => {
        console.error('Omnidim widget error:', error);
        setIsWebCallActive(false);
        setCallState(prev => ({ 
          ...prev, 
          status: 'error', 
          error: error.message || 'Voice connection failed'
        }));
        toast({
          title: "Voice Connection Failed", 
          description: "Please check your microphone permissions and internet connection, then try again.",
          variant: "destructive",
        });
      });

      omnidimWidgetRef.current.on('audioLevel', (level: number) => {
        // Update audio level for visual feedback
        if (level > 0.1) {
          console.log('Audio detected, level:', level);
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Omnidim widget:', error);
      toast({
        title: "Voice Setup Failed",
        description: "Could not initialize voice calling. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Enhanced start call function with real web audio support
  const startWebCall = async () => {
    try {
      console.log('Starting web call...');
      
      if (!omnidimWidgetRef.current) {
        console.log('Widget not initialized, initializing now...');
        const initialized = await initializeOmnidimWidget();
        if (!initialized) {
          console.error('Failed to initialize widget');
          return false;
        }
      }

      // Check microphone permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('Microphone access granted');
      } catch (micError) {
        console.error('Microphone access denied:', micError);
        toast({
          title: "Microphone Required",
          description: "Please allow microphone access to talk with Rooma.",
          variant: "destructive",
        });
        return false;
      }

      console.log('Starting call with Rooma agent...');
      
      // Use the real agent ID from backend
      const callConfig = {
        agentId: callState.agentId,
        mode: 'web-audio',
        enableRealTimeAudio: true,
        enableTranscription: true,
        voice: {
          provider: 'eleven_labs',
          voice_id: 'cgSgspJ2msm6clMCkdW9',
          speed: 1.0,
          pitch: 1.0
        }
      };
      
      console.log('Call config:', callConfig);
      
      const success = await omnidimWidgetRef.current.startCall(callConfig);
      
      if (success) {
        console.log('Web call started successfully');
        setCallState(prev => ({ ...prev, status: 'in-call' }));
        return true;
      } else {
        console.error('Failed to start web call');
        return false;
      }
    } catch (error) {
      console.error('Failed to start web call:', error);
      toast({
        title: "Call Failed",
        description: "Unable to start voice call. Please check your internet connection and microphone permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  // State for conversation progress
  const [conversationProgress, setConversationProgress] = useState({
    progress: 0,
    currentStep: 0,
    totalSteps: 10,
    currentQuestion: ''
  });

  // Poll call status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPolling && callState.callId) {
      interval = setInterval(async () => {
        try {
          const response = await apiRequest(`/api/omnidim/calls/${callState.callId}/status`, "GET");
          const status = await response.json();
          
          // Update conversation progress
          if (status.call_data) {
            setConversationProgress({
              progress: status.call_data.progress || 0,
              currentStep: status.call_data.currentStep || 0,
              totalSteps: status.call_data.totalSteps || 10,
              currentQuestion: status.call_data.currentQuestion || ''
            });
          }
          
          if (status.status === 'completed' && status.transcript) {
            setIsPolling(false);
            setCallState(prev => ({
              ...prev,
              status: 'completed',
              transcript: status.transcript
            }));
            
            // Auto-complete when interview finishes - no need to process transcript separately
            // as the profile is already updated in the backend
            queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
            toast({
              title: "Profile Setup Complete!",
              description: "Your voice interview has been processed and your profile is now complete.",
            });
            onComplete?.(status);
          }
        } catch (error) {
          console.error('Error polling call status:', error);
        }
      }, 2000); // Poll every 2 seconds for real-time updates
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPolling, callState.callId]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (callState.status === 'in-call') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (callState.status) {
      case 'agent-ready':
        return 'bg-green-500';
      case 'in-call':
        return 'bg-blue-500 animate-pulse';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (callState.status) {
      case 'idle':
        return 'Ready to start';
      case 'creating-agent':
        return 'Setting up voice assistant...';
      case 'agent-ready':
        return 'Voice assistant ready';
      case 'calling':
        return 'Connecting...';
      case 'in-call':
        return `In call - ${formatDuration(callDuration)}`;
      case 'completed':
        return 'Interview completed';
      case 'error':
        return 'Error occurred';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg mx-auto bg-white dark:bg-gray-900 shadow-2xl">
        <CardHeader className="text-center relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center justify-center mb-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor()} mr-3`}></div>
            <CardTitle className="text-xl">Voice Assistant Setup</CardTitle>
          </div>
          
          <Badge variant="outline" className="w-fit mx-auto">
            {getStatusText()}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="text-center space-y-4">
            {callState.status === 'idle' && (
              <>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Meet Rooma</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Rooma is your AI voice assistant who will ask you questions about your lifestyle and roommate preferences. The interview takes about 5-10 minutes.
                  </p>
                </div>
              </>
            )}

            {callState.status === 'creating-agent' && (
              <>
                <div className="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">Setting up your voice assistant...</p>
              </>
            )}

            {callState.status === 'agent-ready' && (
              <>
                <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                  <Phone className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600">Ready to Start</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Rooma is ready to interview you. Click "Start Call" when you're ready to begin.
                  </p>
                </div>
              </>
            )}

            {callState.status === 'in-call' && (
              <>
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Volume2 className={`w-10 h-10 text-white ${isWebCallActive ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600">
                    {isWebCallActive ? '🎙️ Live Audio Call' : 'In Progress'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {isWebCallActive 
                      ? "You're speaking with Rooma! She can hear you and you can hear her voice. Answer her questions naturally."
                      : "You're connected with Rooma. Answer her questions naturally about your lifestyle and preferences."
                    }
                  </p>
                  <div className="text-2xl font-mono text-blue-600 mt-2">
                    {formatDuration(callDuration)}
                  </div>
                  
                  {/* Audio Status Indicator */}
                  {isWebCallActive && (
                    <div className="mt-3 flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      <span className="text-xs text-green-600 font-medium">Audio Connected</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Step {conversationProgress.currentStep} of {conversationProgress.totalSteps}</span>
                      <span>{Math.round(conversationProgress.progress)}%</span>
                    </div>
                    <Progress value={conversationProgress.progress} className="w-full" />
                  </div>
                  
                  {/* Interview Tips */}
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      <strong>Tip:</strong> {isWebCallActive 
                        ? "Speak naturally as if talking to a friend. Rooma will ask follow-up questions based on your answers." 
                        : "Speak clearly and naturally. Rooma is listening and will ask follow-up questions based on your responses."
                      }
                    </p>
                  </div>
                </div>
              </>
            )}

            {callState.status === 'completed' && (
              <>
                <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-green-600">Interview Complete!</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Your voice interview has been processed and your profile is now complete. You can start discovering compatible roommates!
                  </p>
                </div>
              </>
            )}

            {callState.status === 'error' && (
              <>
                <div className="w-20 h-20 mx-auto bg-red-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-red-600">Error</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {callState.error || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {callState.status === 'idle' && (
              <Button
                onClick={async () => {
                  // Check microphone permissions first
                  try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setCallState(prev => ({ ...prev, status: 'creating-agent' }));
                    createAgentMutation.mutate();
                  } catch (error) {
                    toast({
                      title: "Microphone Access Required",
                      description: "Please allow microphone access to use voice calling features.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={!isAuthenticated || createAgentMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {createAgentMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting Up...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Setup Voice Assistant
                  </>
                )}
              </Button>
            )}

            {callState.status === 'agent-ready' && (
              <Button
                onClick={async () => {
                  console.log('Start Call button clicked');
                  
                  // Use API calling instead of web widget since web widget is not working
                  if (callState.agentId) {
                    setCallState(prev => ({ ...prev, status: 'calling' }));
                    
                    toast({
                      title: "Starting Voice Call...",
                      description: "Connecting you with Rooma for your voice interview.",
                    });
                    
                    startCallMutation.mutate(callState.agentId);
                  } else {
                    console.error('No agent ID available');
                    toast({
                      title: "Setup Error",
                      description: "Voice assistant not properly initialized. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={startCallMutation.isPending}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {startCallMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <PhoneCall className="w-4 h-4 mr-2" />
                    Start Call with Rooma
                  </>
                )}
              </Button>
            )}

            {callState.status === 'in-call' && (
              <Button
                onClick={() => {
                  // End web call if active
                  if (isWebCallActive && omnidimWidgetRef.current?.endCall) {
                    omnidimWidgetRef.current.endCall();
                  }
                  // Reset state for both web and API calls
                  setIsPolling(false);
                  setIsWebCallActive(false);
                  setCallState(prev => ({ ...prev, status: 'idle' }));
                  setCallDuration(0);
                }}
                variant="destructive"
                className="w-full"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                End Call
              </Button>
            )}

            {(callState.status === 'completed' || callState.status === 'error') && (
              <>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
                {callState.status === 'error' && (
                  <Button
                    onClick={() => {
                      setCallState({ status: 'idle' });
                      setCallDuration(0);
                    }}
                    className="flex-1"
                  >
                    Try Again
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Tips */}
          {(callState.status === 'idle' || callState.status === 'agent-ready') && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Interview Tips:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Speak clearly and naturally</li>
                <li>• Be honest about your preferences</li>
                <li>• Mention specific details about your lifestyle</li>
                <li>• The whole process takes 5-10 minutes</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}