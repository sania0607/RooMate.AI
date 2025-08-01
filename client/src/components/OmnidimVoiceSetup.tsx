import { useState, useEffect } from "react";
import { normalizeSpokenNumber } from "@/lib/normalizeSpokenNumber";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Phone, PhoneCall, CheckCircle, AlertTriangle, Clock, Volume2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OmnidimVoiceSetupProps {
  onComplete: (profileData: any) => void;
  onClose?: () => void;
}

export default function OmnidimVoiceSetup({ onComplete, onClose }: OmnidimVoiceSetupProps) {
  const [agentId, setAgentId] = useState<string | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'creating-agent' | 'starting-call' | 'in-progress' | 'completed' | 'error'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string>('');
  
  const { toast } = useToast();

  // Create Omnidim agent
  const createAgentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/omnidim/create-agent", {});
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.agent) {
        setAgentId(data.agent.id);
        setCallStatus('starting-call');
        // Automatically start the call
        startCallMutation.mutate({ agentId: data.agent.id });
      }
    },
    onError: (error) => {
      setCallStatus('error');
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
      const errorMsg = error.message || "Failed to create voice assistant";
      setError(errorMsg);
      toast({
        title: "Voice Setup Failed",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Start Omnidim call
  const startCallMutation = useMutation({
    mutationFn: async ({ agentId }: { agentId: string }) => {
      const response = await apiRequest("POST", "/api/omnidim/start-call", { agentId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.call) {
        setCallId(data.call.id);
        setCallStatus('in-progress');
        toast({
          title: "Voice Interview Started",
          description: "Your voice interview with Rooma has begun!",
        });
      }
    },
    onError: (error) => {
      setCallStatus('error');
      const errorMsg = error.message || "Failed to start voice call";
      setError(errorMsg);
      toast({
        title: "Call Failed",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Poll call status
  const { data: callStatusData, isLoading: isPolling } = useQuery({
    queryKey: ["omnidim-call-status", callId],
    queryFn: async () => {
      if (!callId) return null;
      const response = await apiRequest("GET", `/api/omnidim/calls/${callId}/status`);
      return response.json();
    },
    enabled: !!callId && callStatus === 'in-progress',
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Process transcript when call is completed
  const processTranscriptMutation = useMutation({
    mutationFn: async ({ callId, transcript }: { callId: string; transcript: string }) => {
      const response = await apiRequest("POST", "/api/omnidim/process-transcript", { 
        callId, 
        transcript 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setCallStatus('completed');
        toast({
          title: "Profile Updated",
          description: "Your voice interview has been processed and your profile updated!",
        });
        onComplete(data.profileData);
      }
    },
    onError: (error) => {
      setCallStatus('error');
      const errorMsg = error.message || "Failed to process interview";
      setError(errorMsg);
      toast({
        title: "Processing Failed",
        description: errorMsg,
        variant: "destructive",
      });
    },
  });

  // Handle call status updates
  useEffect(() => {
    if (callStatusData) {
      if (callStatusData.status === 'completed' && callStatusData.transcript) {
        // Normalize all numbers in the transcript before processing
        // Detect browser language for number normalization
        const userLang = navigator.language || 'en';
        const normalizedTranscript = normalizeSpokenNumber(callStatusData.transcript, userLang);
        setTranscript(normalizedTranscript);
        // Process the normalized transcript
        processTranscriptMutation.mutate({
          callId: callId!,
          transcript: normalizedTranscript
        });
      } else if (callStatusData.status === 'failed') {
        setCallStatus('error');
        setError('Voice interview failed');
      }
    }
  }, [callStatusData, callId]);

  const handleStartVoiceSetup = () => {
    setCallStatus('creating-agent');
    setError('');
    createAgentMutation.mutate();
  };

  const getStatusIcon = () => {
    switch (callStatus) {
      case 'creating-agent':
        return <Loader2 className="w-8 h-8 animate-spin text-purple-600" />;
      case 'starting-call':
        return <Phone className="w-8 h-8 text-blue-600" />;
      case 'in-progress':
        return <PhoneCall className="w-8 h-8 text-green-600 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-8 h-8 text-red-600" />;
      default:
        return <Mic className="w-8 h-8 text-purple-600" />;
    }
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'creating-agent':
        return 'Setting up your voice assistant...';
      case 'starting-call':
        return 'Starting your voice interview...';
      case 'in-progress':
        return 'Voice interview in progress with Rooma...';
      case 'completed':
        return 'Voice interview completed successfully!';
      case 'error':
        return `Error: ${error}`;
      default:
        return 'Ready to start your voice profile setup';
    }
  };

  const getProgress = () => {
    switch (callStatus) {
      case 'creating-agent':
        return 25;
      case 'starting-call':
        return 50;
      case 'in-progress':
        return 75;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
            <Mic className="w-5 h-5" />
            Real-Time Voice Profile Setup
          </CardTitle>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Have a conversation with Rooma, our AI voice assistant
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white dark:bg-gray-800 shadow-lg">
              {getStatusIcon()}
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {getStatusText()}
              </p>
              
              {callStatus === 'in-progress' && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Rooma will ask about your lifestyle, preferences, and what you're looking for in a roommate
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {callStatus !== 'idle' && callStatus !== 'error' && (
              <div className="w-full max-w-md">
                <Progress value={getProgress()} className="h-3" />
                <p className="text-xs text-center text-gray-500 mt-1">
                  {getProgress()}% Complete
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {callStatus === 'idle' && (
              <Button
                onClick={handleStartVoiceSetup}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                disabled={createAgentMutation.isPending}
              >
                <Mic className="w-5 h-5" />
                Start Voice Interview
              </Button>
            )}

            {callStatus === 'error' && (
              <Button
                onClick={handleStartVoiceSetup}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/20"
              >
                Try Again
              </Button>
            )}

            {onClose && (
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Interview Instructions */}
          {callStatus === 'idle' && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2">What to expect:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>5-10 minute friendly conversation with Rooma</li>
                <li>Questions about sleep habits, cleanliness, and social preferences</li>
                <li>Discussion of room preferences and lifestyle</li>
                <li>Your responses automatically complete your profile</li>
                <li>Immediate matching with compatible roommates</li>
              </ul>
            </div>
          )}

          {/* Transcript Preview */}
          {transcript && callStatus === 'completed' && (
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Interview Summary:</h4>
              <p className="text-sm text-green-700 dark:text-green-300 line-clamp-3">
                {transcript.substring(0, 200)}...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}