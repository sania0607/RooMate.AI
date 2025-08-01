import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  MessageCircle,
  PhoneOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface InteractiveVoiceChatProps {
  onComplete: (profileData: any) => void;
  onClose?: () => void;
}

interface Question {
  step: number;
  question: string;
  expectedResponse: string;
  followUp?: string;
}

export default function InteractiveVoiceChat({ onComplete, onClose }: InteractiveVoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isCallActive, setIsCallActive] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasPermissions, setHasPermissions] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  const questions: Question[] = [
    {
      step: 0,
      question: "Hi! This is Rooma from RooMate.ai. I'd like to ask a few questions to help match you with a compatible roommate. What's your name?",
      expectedResponse: "name",
      followUp: "Great to meet you! Let's get started with some questions about your lifestyle."
    },
    {
      step: 1,
      question: "What time do you usually go to bed and wake up? For example, 'I sleep at 11 PM and wake up at 7 AM'",
      expectedResponse: "sleep_schedule",
      followUp: "Got it! That helps me understand your schedule."
    },
    {
      step: 2,
      question: "On a scale of 1 to 5, how clean and organized are you? 1 being very messy, 5 being extremely clean.",
      expectedResponse: "cleanliness",
      followUp: "Perfect! Cleanliness compatibility is really important."
    },
    {
      step: 3,
      question: "How social are you? Do you prefer quiet nights at home, or do you like having friends over regularly?",
      expectedResponse: "social_level",
      followUp: "That's helpful to know for matching compatibility."
    },
    {
      step: 4,
      question: "Do you have any pets or are you planning to get any? And are you okay living with pets?",
      expectedResponse: "pets",
      followUp: "Thanks for sharing that information about pets."
    },
    {
      step: 5,
      question: "Do you smoke or are you okay with roommates who smoke?",
      expectedResponse: "smoking",
      followUp: "Good to know about your smoking preferences."
    },
    {
      step: 6,
      question: "What are your main interests or hobbies? For example, fitness, reading, music, cooking.",
      expectedResponse: "interests",
      followUp: "Those are great interests! Common hobbies help roommate relationships."
    },
    {
      step: 7,
      question: "Would you prefer a single room or are you open to sharing? And do you like quiet or lively atmosphere?",
      expectedResponse: "room_preferences",
      followUp: "Excellent! That gives me a good sense of your living preferences."
    },
    {
      step: 8,
      question: "Finally, what's your budget range for rent? This helps us match you with compatible roommates.",
      expectedResponse: "budget",
      followUp: "Perfect! That completes our interview."
    },
    {
      step: 9,
      question: "Thank you for taking the time to answer these questions! I've gathered all the information needed to help find you the perfect roommate match. Your profile will be updated shortly. Have a great day!",
      expectedResponse: "closing",
      followUp: "Interview completed successfully!"
    }
  ];

  // Initialize speech services
  useEffect(() => {
    if ('speechSynthesis' in window && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      synthRef.current = window.speechSynthesis;
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = handleSpeechResult;
        recognitionRef.current.onerror = handleSpeechError;
        recognitionRef.current.onend = () => setIsListening(false);
      }
      
      checkPermissions();
    } else {
      setError('Your browser does not support voice features. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  const checkPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermissions(true);
    } catch (error) {
      setError('Microphone access is required for voice chat. Please allow microphone access.');
      setHasPermissions(false);
    }
  };

  const speak = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) {
        resolve();
        return;
      }

      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use a female voice for Rooma
      const voices = synthRef.current.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria') ||
        voice.name.includes('Zira')
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      synthRef.current.speak(utterance);
    });
  };

  const startListening = () => {
    if (!recognitionRef.current || !hasPermissions) return;
    
    setIsListening(true);
    setError('');
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleSpeechResult = (event: any) => {
    const result = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    
    if (confidence > 0.5) {
      processUserResponse(result);
    } else {
      toast({
        title: "Could not understand",
        description: "Please speak more clearly and try again.",
        variant: "destructive"
      });
      // Restart listening
      setTimeout(() => startListening(), 1000);
    }
  };

  const handleSpeechError = (event: any) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    
    if (event.error === 'no-speech') {
      toast({
        title: "No speech detected",
        description: "Please speak into your microphone and try again.",
      });
    } else if (event.error === 'network') {
      setError('Network error. Please check your connection.');
    }
  };

  const processUserResponse = async (userResponse: string) => {
    const currentQuestion = questions[currentStep];
    
    // Add to transcript
    setTranscript(prev => [...prev, `You: ${userResponse}`, `Rooma: Processing response...`]);
    
    // Process and store response
    const processedResponse = processResponseByType(currentQuestion.expectedResponse, userResponse);
    setResponses(prev => ({ ...prev, ...processedResponse }));
    
    // Speak follow-up if available
    if (currentQuestion.followUp) {
      await speak(currentQuestion.followUp);
    }
    
    // Move to next question
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
      setProgress(((currentStep + 1) / questions.length) * 100);
      
      // Ask next question after a brief pause
      setTimeout(async () => {
        const nextQuestion = questions[currentStep + 1];
        await speak(nextQuestion.question);
        
        // Start listening for response if not the closing question
        if (nextQuestion.expectedResponse !== 'closing') {
          setTimeout(() => startListening(), 1000);
        }
      }, 2000);
    } else {
      // Interview completed
      completeInterview();
    }
  };

  const processResponseByType = (type: string, response: string) => {
    const lowerResponse = response.toLowerCase();
    
    switch (type) {
      case 'name':
        return { name: response };
      
      case 'sleep_schedule':
        const sleepData: any = { sleepSchedule: response };
        if (lowerResponse.includes('early') || lowerResponse.includes('morning')) {
          sleepData.sleepType = 'early_bird';
        } else if (lowerResponse.includes('night') || lowerResponse.includes('late')) {
          sleepData.sleepType = 'night_owl';
        }
        return sleepData;
      
      case 'cleanliness':
        const cleanNumber = response.match(/[1-5]/);
        return {
          cleanliness: cleanNumber ? parseInt(cleanNumber[0]) : 3,
          cleanlinessDescription: response
        };
      
      case 'social_level':
        let socialLevel = 'moderate';
        if (lowerResponse.includes('quiet') || lowerResponse.includes('introvert')) {
          socialLevel = 'quiet';
        } else if (lowerResponse.includes('social') || lowerResponse.includes('friends') || lowerResponse.includes('party')) {
          socialLevel = 'social';
        }
        return { socialLevel, socialDescription: response };
      
      case 'pets':
        return {
          hasPets: lowerResponse.includes('yes') || lowerResponse.includes('have'),
          okayWithPets: !lowerResponse.includes('no pets') && !lowerResponse.includes('allergic'),
          petsDescription: response
        };
      
      case 'smoking':
        return {
          smokes: lowerResponse.includes('yes') || lowerResponse.includes('smoke'),
          okayWithSmoking: !lowerResponse.includes('no smoking') && !lowerResponse.includes('hate smoke'),
          smokingPreference: response
        };
      
      case 'interests':
        const interests = response.split(/[,\s]+/).filter(word => word.length > 2);
        return { interests, interestsDescription: response };
      
      case 'room_preferences':
        return {
          roomType: lowerResponse.includes('single') ? 'single' : 'shared',
          atmosphere: lowerResponse.includes('quiet') ? 'quiet' : 'lively',
          roomPreferences: response
        };
      
      case 'budget':
        const budgetMatch = response.match(/\$?(\d+)/);
        return {
          budget: budgetMatch ? parseInt(budgetMatch[1]) : 0,
          budgetDescription: response
        };
      
      default:
        return { [type]: response };
    }
  };

  const completeInterview = () => {
    setIsCallActive(false);
    setProgress(100);
    
    toast({
      title: "Interview Complete!",
      description: "Your voice profile has been created successfully.",
    });
    
    // Generate profile data from responses
    const profileData = {
      ...responses,
      isComplete: true,
      completedViaVoice: true,
      completedAt: new Date().toISOString(),
    };
    
    onComplete(profileData);
  };

  const startInterview = async () => {
    setIsCallActive(true);
    setCurrentStep(0);
    setProgress(0);
    setTranscript([]);
    setResponses({});
    setError('');
    
    // Start with first question
    await speak(questions[0].question);
    
    // Start listening after the question
    setTimeout(() => startListening(), 1000);
  };

  const endCall = () => {
    setIsCallActive(false);
    setIsListening(false);
    setIsSpeaking(false);
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    onClose?.();
  };

  if (error && !hasPermissions) {
    return (
      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Microphone Access Required
          </h3>
          <p className="text-red-700 dark:text-red-300 mb-4">
            {error}
          </p>
          <Button onClick={checkPermissions} variant="outline" className="border-red-300 text-red-600">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
            <MessageCircle className="w-5 h-5" />
            Voice Assistant Setup
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {isCallActive ? 'In call' : 'Ready'} - {Math.round(progress / 10)}:{String(Math.round((progress % 10) * 6)).padStart(2, '0')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Status Display */}
          <div className="flex flex-col items-center space-y-4">
            <div className={cn(
              "flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all duration-300",
              isSpeaking ? "bg-blue-100 dark:bg-blue-900" : "bg-white dark:bg-gray-800"
            )}>
              {isSpeaking ? (
                <Volume2 className="w-8 h-8 text-blue-600 animate-pulse" />
              ) : isListening ? (
                <Mic className="w-8 h-8 text-green-600 animate-pulse" />
              ) : isCallActive ? (
                <Phone className="w-8 h-8 text-purple-600" />
              ) : (
                <MessageCircle className="w-8 h-8 text-purple-600" />
              )}
            </div>
            
            <div className="text-center">
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {isSpeaking ? "Rooma is speaking..." : 
                 isListening ? "Listening for your response..." :
                 isCallActive ? "Voice interview in progress" :
                 "Ready to start voice interview"}
              </p>
              
              {isCallActive && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Step {currentStep + 1} of {questions.length}
                  {currentStep < questions.length && (
                    <span className="block mt-1 text-xs">
                      {Math.round((currentStep / questions.length) * 100)}% Complete
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Progress Bar */}
            {isCallActive && (
              <div className="w-full max-w-md">
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>

          {/* Instructions */}
          {!isCallActive && (
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium mb-2 text-center">You're connected with Rooma. Answer her questions naturally about your lifestyle and preferences.</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded p-3 mt-3">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  Tip: Speak clearly and naturally. Rooma is listening and will ask follow-up questions based on your responses.
                </p>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!isCallActive ? (
              <Button
                onClick={startInterview}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                disabled={!hasPermissions}
              >
                <Phone className="w-5 h-5" />
                Start Voice Interview
              </Button>
            ) : (
              <div className="flex gap-4">
                {isListening ? (
                  <Button
                    onClick={stopListening}
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop Listening
                  </Button>
                ) : !isSpeaking && (
                  <Button
                    onClick={startListening}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Start Speaking
                  </Button>
                )}
                
                <Button
                  onClick={endCall}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Call
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}