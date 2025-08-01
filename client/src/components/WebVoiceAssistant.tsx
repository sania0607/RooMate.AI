import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { webAudioService } from "@/services/webAudioService";
import { normalizeSpokenNumber } from "@/lib/normalizeSpokenNumber";
import { 
  Phone, 
  PhoneCall, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle,
  Loader2,
  MessageCircle,
  PlayCircle,
  PauseCircle
} from "lucide-react";

interface WebVoiceAssistantProps {
  onClose: () => void;
  onComplete?: (profileData: any) => void;
}

interface InterviewState {
  callId: string;
  status: 'idle' | 'checking-audio' | 'starting' | 'speaking' | 'listening' | 'processing' | 'completed' | 'error';
  currentQuestion: number;
  totalQuestions: number;
  progress: number;
  transcript: string;
  responses: Record<string, string>;
  retryCount: number;
  lastQuestionAsked: number;
  error?: string;
  omnidimResponses?: {
    responses: Array<{ id: string; question: string; answer: string; timestamp: string }>;
    lastUpdated: string;
  };
}

const interviewQuestions = [
  {
    id: 'name',
    question: "Hi! I'm Rooma, your AI roommate matching assistant. Could you please tell me your name?",
    followUp: "Nice to meet you!",
    examples: "You can say: 'My name is Sarah' or 'I'm Alex' or just 'Sarah'"
  },
  {
    id: 'cleanliness',
    question: "On a scale of 1-5, how important is cleanliness to you in shared spaces? 1 being not important at all, 5 being extremely important.",
    followUp: "That's helpful to know for matching!",
    examples: "You can say: 'Five', 'I would say 4', 'Very important, 5', or 'Not very important, 2'"
  },
  {
    id: 'socialLevel',
    question: "How social are you? On a scale of 1-5, do you prefer quiet time at home, which would be 1, or lots of social interaction, which would be 5?",
    followUp: "Great, that helps me understand your social preferences.",
    examples: "You can say: 'Three', 'I'm pretty social, 4', 'I prefer quiet time, 2', or 'Very social, 5'"
  },
  {
    id: 'sleepTime',
    question: "What time do you usually go to bed? This helps match you with someone with a compatible schedule.",
    followUp: "Perfect, sleep schedules are important for compatibility.",
    examples: "You can say: '10 PM', 'Around 11', 'I go to bed at 10:30', or 'Late, around midnight'"
  },
  {
    id: 'pets',
    question: "Do you have any pets, or are you okay living with pets?",
    followUp: "Good to know about your pet preferences.",
    examples: "You can say: 'Yes, I have a cat', 'No pets', 'I have a dog', or 'I'm okay with pets'"
  },
  {
    id: 'interests',
    question: "What are some of your interests or hobbies? This helps find someone you might connect with.",
    followUp: "Those sound like great interests!",
    examples: "You can say: 'I like reading and yoga', 'Cooking and hiking', 'Music and art', or 'Sports and movies'"
  },
  {
    id: 'roomType',
    question: "Would you prefer a single room or are you open to sharing a room?",
    followUp: "Perfect! That completes our interview. Thank you for sharing all this information with me!",
    examples: "You can say: 'Single room', 'I prefer my own room', 'I'm okay sharing', or 'Either is fine'"
  }
];

// Helper function to convert responses to profile data structure
const convertResponseToProfileData = (questionId: string, response: string) => {
  const profileData: any = {};
  const trimmed = response.trim();
  switch (questionId) {
    case 'name':
      profileData.name = trimmed;
      break;
    case 'cleanliness': {
      let val = trimmed;
      if (/^\d$/.test(val)) {
        val = val;
      } else {
        val = val.match(/\d+/)?.[0] || '3';
      }
      const cleanlinessValue = parseInt(val, 10);
      profileData.lifestyle = {
        cleanliness: Math.min(Math.max(cleanlinessValue, 1), 5),
        cleanlinessImportance: cleanlinessValue >= 4 ? 'high' : cleanlinessValue >= 3 ? 'medium' : 'low'
      };
      break;
    }
    case 'socialLevel': {
      let val = trimmed;
      if (/^\d$/.test(val)) {
        val = val;
      } else {
        val = val.match(/\d+/)?.[0] || '3';
      }
      const socialValue = parseInt(val, 10);
      profileData.lifestyle = {
        socialLevel: Math.min(Math.max(socialValue, 1), 5),
        socialLevelImportance: socialValue >= 4 ? 'high' : socialValue >= 3 ? 'medium' : 'low'
      };
      break;
    }
    case 'sleepTime':
      profileData.lifestyle = {
        sleepTime: trimmed,
        sleepImportance: 'medium'
      };
      break;
    case 'pets':
      const hasPets = trimmed.toLowerCase().includes('yes') || trimmed.toLowerCase().includes('have');
      profileData.lifestyle = {
        pets: hasPets,
        petType: hasPets ? (trimmed.toLowerCase().includes('cat') ? 'cat' : trimmed.toLowerCase().includes('dog') ? 'dog' : 'other') : undefined
      };
      break;
    case 'interests':
      profileData.interests = trimmed.split(/[,&]/).map(i => i.trim()).filter(i => i.length > 0);
      break;
    case 'roomType':
      const prefersSingle = trimmed.toLowerCase().includes('single');
      profileData.lifestyle = {
        roomType: prefersSingle ? 'single' : 'twin'
      };
      break;
    default:
      return null;
  }
  return profileData;
};

export function WebVoiceAssistant({ onClose, onComplete }: WebVoiceAssistantProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [interviewState, setInterviewState] = useState<InterviewState>({
    callId: `web_interview_${Date.now()}`,
    status: 'idle',
    currentQuestion: 0,
    totalQuestions: interviewQuestions.length,
    progress: 0,
    transcript: '',
    responses: {},
    retryCount: 0,
    lastQuestionAsked: -1,
    omnidimResponses: { responses: [], lastUpdated: new Date().toISOString() }
  });

  const [audioSupported, setAudioSupported] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Check audio support and permissions on mount
  useEffect(() => {
    checkAudioCapabilities();
  }, []);

  const checkAudioCapabilities = async () => {
    setInterviewState(prev => ({ ...prev, status: 'checking-audio' }));
    
    const supported = webAudioService.isAudioSupported();
    setAudioSupported(supported);
    
    if (!supported) {
      toast({
        title: "Audio Not Supported",
        description: "Your browser doesn't support voice features. Please use a modern browser like Chrome.",
        variant: "destructive",
      });
      setInterviewState(prev => ({ ...prev, status: 'error', error: 'Audio not supported' }));
      return;
    }

    const hasPermission = await webAudioService.checkMicrophonePermission();
    setMicPermission(hasPermission);
    
    if (!hasPermission) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to have a voice conversation with Rooma.",
        variant: "destructive",
      });
    }

    setInterviewState(prev => ({ ...prev, status: 'idle' }));
  };

  // Request microphone permission
  const requestMicPermission = async () => {
    const granted = await webAudioService.requestMicrophonePermission();
    setMicPermission(granted);
    
    if (granted) {
      toast({
        title: "Microphone Ready",
        description: "Great! Now you can have a voice conversation with Rooma.",
      });
    } else {
      toast({
        title: "Permission Denied",
        description: "Microphone access is required for voice conversation.",
        variant: "destructive",
      });
    }
  };

  // Start the interview
  const startInterview = async () => {
    if (!audioSupported || !micPermission) {
      toast({
        title: "Setup Required",
        description: "Please enable microphone access first.",
        variant: "destructive",
      });
      return;
    }

    setInterviewState(prev => ({ 
      ...prev, 
      status: 'starting',
      currentQuestion: 0,
      progress: 0,
      responses: {},
      transcript: '',
      retryCount: 0,
      lastQuestionAsked: -1
    }));

    // Start with welcome message
    await askCurrentQuestion();
  };

  // Ask the current question
  const askCurrentQuestion = async () => {
    const question = interviewQuestions[interviewState.currentQuestion];
    if (!question) {
      completeInterview();
      return;
    }

    // Only ask the question once, do not retry
    if (interviewState.lastQuestionAsked === interviewState.currentQuestion) {
      toast({
        title: "Let's try typing instead",
        description: "Voice recognition seems to be having trouble. Please use the text input below to continue.",
      });
      setInterviewState(prev => ({ ...prev, status: 'error', error: 'Voice recognition is having difficulty. Please type your response in the text box below.' }));
      return;
    }

    setInterviewState(prev => ({ 
      ...prev, 
      status: 'speaking',
      lastQuestionAsked: interviewState.currentQuestion,
      retryCount: 0
    }));
    setIsSpeaking(true);

    try {
      // Speak the question
      await webAudioService.speak(question.question);
      setIsSpeaking(false);
      
      // Automatically start listening after speech ends
      setTimeout(() => {
        listenForResponse();
      }, 500); // Small delay to avoid audio interference
      
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsSpeaking(false);
      toast({
        title: "Speech Error",
        description: "There was an issue with speech. Please try again.",
        variant: "destructive",
      });
      setInterviewState(prev => ({ ...prev, status: 'error', error: 'Speech error' }));
    }
  };

  // Listen for user response
  const listenForResponse = async () => {
    console.log('🎤 Starting to listen for user response...');
    
    // Check microphone permission first
    try {
      const hasPermission = await webAudioService.checkMicrophonePermission();
      if (!hasPermission) {
        console.log('🎤 Requesting microphone permission...');
        const granted = await webAudioService.requestMicrophonePermission();
        if (!granted) {
          throw new Error('Microphone permission is required for voice input. Please allow microphone access and try again.');
        }
      }
    } catch (permError: any) {
      console.error('❌ Microphone permission error:', permError);
      setInterviewState(prev => ({ ...prev, status: 'error', error: permError.message }));
      return;
    }
    
    setInterviewState(prev => ({ ...prev, status: 'listening' }));
    setIsListening(true);

    try {
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🎤 Calling webAudioService.listen()...');
      const response = await webAudioService.listen();
      console.log('🎤 Got response from webAudioService:', response);
      
      setIsListening(false);
      
      // Validate response
      if (!response || response.trim().length === 0) {
        throw new Error('No speech detected');
      }
      
      console.log('✅ Successfully captured user response:', response);
      
      // Process the response
      await processResponse(response);
    } catch (error: any) {
      console.error('❌ Error listening:', error);
      setIsListening(false);
      
      const errorMessage = error?.message || "I couldn't hear you clearly. Please speak louder or use the text input below.";
      toast({
        title: "Voice Input Issue",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Allow user to try again - show both speaking and listening options
      setInterviewState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
    }
  };

  // Real-time profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("/api/profile", "PUT", profileData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
    onError: (error: any) => {
      console.error('❌ Profile update failed:', error);
    },
  });

  // Process user response
  const processResponse = async (response: string) => {
    setInterviewState(prev => ({ ...prev, status: 'processing' }));
    const currentQ = interviewQuestions[interviewState.currentQuestion];
    let normalizedResponse = response;
    if (["cleanliness", "socialLevel"].includes(currentQ.id)) {
      normalizedResponse = normalizeSpokenNumber(response);
    }
    const newResponses = { ...interviewState.responses, [currentQ.id]: normalizedResponse };
    const omnidimEntry = {
      id: currentQ.id,
      question: currentQ.question,
      answer: normalizedResponse,
      timestamp: new Date().toISOString()
    };
    const newOmnidimResponses = {
      responses: [ ...(interviewState.omnidimResponses?.responses || []), omnidimEntry ],
      lastUpdated: new Date().toISOString()
    };

    // Build full profile from all responses using convertResponseToProfileData
    let fullProfile: any = {};
    let lifestyle: any = {};
    Object.entries(newResponses).forEach(([qid, ans]) => {
      const mapped = convertResponseToProfileData(qid, ans);
      if (!mapped) return;
      if (mapped.name) fullProfile.name = mapped.name;
      if (mapped.interests) fullProfile.interests = mapped.interests;
      if (mapped.lifestyle) {
        // Merge all lifestyle fields into a single lifestyle object
        if (!fullProfile.lifestyle) fullProfile.lifestyle = {};
        Object.assign(fullProfile.lifestyle, mapped.lifestyle);
      }
    });
    fullProfile.omnidimResponses = newOmnidimResponses;

    // Debug log: show what is sent to backend
    console.log('🟢 Sending profile to backend:', JSON.stringify(fullProfile, null, 2));

    updateProfileMutation.mutate(fullProfile);

    setIsSpeaking(true);
    try {
      await webAudioService.speak(currentQ.followUp);
      setIsSpeaking(false);
    } catch (error) {
      setIsSpeaking(false);
    }

    const nextQuestion = interviewState.currentQuestion + 1;
    const newProgress = Math.round((nextQuestion / interviewState.totalQuestions) * 100);

    if (nextQuestion < interviewState.totalQuestions) {
      setInterviewState(prev => ({
        ...prev,
        currentQuestion: nextQuestion,
        progress: newProgress,
        responses: newResponses,
        omnidimResponses: newOmnidimResponses,
        status: 'speaking'
      }));
      // Immediately ask the next question after state update
      setTimeout(() => {
        askNextQuestion(nextQuestion);
      }, 500);
    } else {
      setInterviewState(prev => ({
        ...prev,
        currentQuestion: nextQuestion,
        progress: 100,
        responses: newResponses,
        omnidimResponses: newOmnidimResponses,
        status: 'completed'
      }));
      completeInterview();
    }
  };

  // Ask specific question by index
  const askNextQuestion = async (questionIndex: number) => {
    const question = interviewQuestions[questionIndex];
    if (!question) {
      completeInterview();
      return;
    }

    console.log('🎤 Asking question', questionIndex + 1, ':', question.question);
    setInterviewState(prev => ({ ...prev, status: 'speaking' }));
    setIsSpeaking(true);

    try {
      await webAudioService.speak(question.question);
      setIsSpeaking(false);
      setTimeout(() => {
        listenForResponse();
      }, 500);
    } catch (error) {
      console.error('Error speaking question:', error);
      setIsSpeaking(false);
      setInterviewState(prev => ({ ...prev, status: 'error', error: 'Speech error' }));
    }
  };

  // Complete the interview
  const completeInterview = async () => {
    const state = interviewState;
    console.log('🎉 Completing interview with responses:', state.responses);
    try {
      await webAudioService.speak("Perfect! Thank you for completing the interview. I'm now processing your responses to set up your profile.");
    } catch (error) {
      console.error('Error speaking completion message:', error);
    }
    try {
      const data = await processInterviewMutation.mutateAsync({
        callId: state.callId,
        transcript: state.transcript,
        responses: state.responses
      });
      console.log('✅ Interview processed, profile setup:', data);
      toast({
        title: "Profile Setup Complete!",
        description: `Welcome ${data.profileData?.name || 'to RooMate.ai'}! Your profile has been automatically completed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (onComplete) onComplete(data.profileData);
      setInterviewState(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      console.error('❌ Interview processing failed:', error);
      toast({
        title: "Profile Setup Failed",
        description: "There was an error setting up your profile. Please try again or contact support.",
        variant: "destructive",
      });
      setInterviewState(prev => ({ ...prev, status: 'error', error: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : 'Profile setup failed' }));
    }
  };

  // Process interview mutation
  const processInterviewMutation = useMutation({
    mutationFn: async (data: { callId: string; transcript: string; responses: Record<string, string> }) => {
      console.log('🚀 Sending interview data to server:', data);
      const response = await apiRequest("/api/omnidim/process-interview", "POST", data);
      const result = await response.json();
      console.log('📥 Server response:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('✅ Interview processing successful:', data);
      toast({
        title: "Profile Setup Complete!",
        description: `Welcome ${data.profileData?.name || 'to RooMate.ai'}! Your profile has been automatically completed.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      onComplete?.(data.profileData);
    },
    onError: (error: any) => {
      console.error('❌ Interview processing failed:', error);
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
        description: `Failed to process your interview: ${error?.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Stop current activity
  const stopActivity = () => {
    webAudioService.stopSpeaking();
    webAudioService.stopListening();
    setIsSpeaking(false);
    setIsListening(false);
    setInterviewState(prev => ({ ...prev, status: 'idle' }));
  };

  const getStatusMessage = () => {
    switch (interviewState.status) {
      case 'checking-audio':
        return "Checking audio capabilities...";
      case 'starting':
        return "Starting interview...";
      case 'speaking':
        return "🎤 Rooma is speaking...";
      case 'listening':
        return "👂 Listening for your response...";
      case 'processing':
        return "Processing your response...";
      case 'completed':
        return "Interview completed!";
      case 'error':
        return `Error: ${interviewState.error}`;
      default:
        return "Ready to start voice interview";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">🎤 Voice Interview with Rooma</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{interviewState.progress}%</span>
            </div>
            <Progress value={interviewState.progress} className="w-full" />
            <div className="text-xs text-center text-gray-600">
              Question {Math.min(interviewState.currentQuestion + 1, interviewState.totalQuestions)} of {interviewState.totalQuestions}
            </div>
          </div>

          {/* Status */}
          <div className="text-center space-y-2">
            <div className="text-sm font-medium">{getStatusMessage()}</div>
            
            {/* Audio indicators */}
            <div className="flex justify-center space-x-4">
              {isSpeaking && (
                <Badge variant="default" className="flex items-center space-x-1">
                  <Volume2 className="h-3 w-3" />
                  <span>Speaking</span>
                </Badge>
              )}
              {isListening && (
                <Badge variant="secondary" className="flex items-center space-x-1 animate-pulse">
                  <Mic className="h-3 w-3" />
                  <span>Listening</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col space-y-3">
            {interviewState.status === 'idle' && (
              <>
                {!audioSupported && (
                  <div className="text-center text-red-600 text-sm">
                    ❌ Audio not supported in this browser
                  </div>
                )}
                
                {audioSupported && !micPermission && (
                  <Button 
                    onClick={requestMicPermission}
                    className="w-full"
                    variant="outline"
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Enable Microphone
                  </Button>
                )}
                
                {audioSupported && micPermission && (
                  <Button 
                    onClick={startInterview}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    <PhoneCall className="h-4 w-4 mr-2" />
                    Start Voice Interview
                  </Button>
                )}
              </>
            )}

            {interviewState.status === 'speaking' && (
              <Button 
                onClick={listenForResponse}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Mic className="h-4 w-4 mr-2" />
                I'm Ready to Answer
              </Button>
            )}

            {interviewState.status === 'listening' && (
              <div className="space-y-2">
                <div className="text-center text-sm text-gray-600 mb-2">
                  🎤 Speak clearly now...
                </div>
                <Button 
                  onClick={stopActivity}
                  variant="outline"
                  className="w-full"
                >
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </Button>
                <div className="text-center text-sm text-blue-600 animate-pulse">
                  🎤 Speak now... Rooma is listening
                </div>
              </div>
            )}

            {interviewState.status === 'processing' && (
              <div className="text-center space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <div className="text-sm text-gray-600">Processing your response...</div>
              </div>
            )}

            {interviewState.status === 'completed' && (
              <div className="text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                <div className="text-sm text-green-600">
                  Interview completed successfully!
                </div>
              </div>
            )}

            {interviewState.status === 'error' && (
              <div className="text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <div className="text-sm text-red-600">{interviewState.error}</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => askCurrentQuestion()}
                    variant="outline"
                    className="w-full"
                    size="sm"
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    Repeat Question
                  </Button>
                  <Button 
                    onClick={listenForResponse}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Try Voice Again
                  </Button>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Having trouble? The text input below always works!
                  </div>
                </div>
                
                {/* Text input fallback */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                  <div className="text-sm text-gray-600 mb-2">
                    Voice not working? Type your answer:
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                      data-testid="input-manual-answer"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            processResponse(target.value.trim());
                            target.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      data-testid="button-send-manual"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                        if (input?.value.trim()) {
                          processResponse(input.value.trim());
                          input.value = '';
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Current Question Preview with Examples */}
          {interviewState.status !== 'idle' && interviewState.currentQuestion < interviewState.totalQuestions && (
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-xs text-gray-600 mb-1">Current Question:</div>
              <div className="text-sm mb-2">
                {interviewQuestions[interviewState.currentQuestion]?.question}
              </div>
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <div className="font-medium mb-1">💡 Example responses:</div>
                <div>{interviewQuestions[interviewState.currentQuestion]?.examples}</div>
              </div>
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded mt-2">
                <div className="font-medium mb-1">🎤 Voice tips:</div>
                <div>• Speak clearly and loudly</div>
                <div>• Get close to your microphone</div>
                <div>• Speak in a quiet environment</div>
                <div>• If voice fails, use the text input below</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}