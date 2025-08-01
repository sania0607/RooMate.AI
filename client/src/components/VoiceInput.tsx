import { useState } from "react";
import OmnidimVoiceSetup from "./OmnidimVoiceSetup";
import InteractiveVoiceChat from "./InteractiveVoiceChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, ArrowRight, MessageCircle } from "lucide-react";

interface VoiceInputProps {
  onResult: (data: { transcription: string; profileData: any }) => void;
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [useInteractive, setUseInteractive] = useState(false);
  const [useOmnidim, setUseOmnidim] = useState(false);

  if (useInteractive) {
    return (
      <InteractiveVoiceChat
        onComplete={(profileData) => {
          onResult({ 
            transcription: "Voice interview completed successfully",
            profileData 
          });
        }}
        onClose={() => setUseInteractive(false)}
      />
    );
  }

  if (useOmnidim) {
    return (
      <OmnidimVoiceSetup
        onComplete={(profileData) => {
          onResult({ 
            transcription: "Voice interview completed successfully",
            profileData 
          });
        }}
        onClose={() => setUseOmnidim(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
            <Mic className="w-5 h-5" />
            Voice Profile Setup
          </CardTitle>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Choose your preferred voice setup method
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-6 text-center max-w-lg">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Real-Time Voice Interview with Rooma
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Have a natural conversation with our AI assistant. Rooma will ask about your lifestyle, 
                preferences, and what you're looking for in a roommate. Your responses automatically 
                complete your entire profile.
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1 mb-4">
                <p>• 5-10 minute friendly conversation</p>
                <p>• Questions about sleep, cleanliness, and social habits</p>
                <p>• Room preferences and lifestyle discussion</p>
                <p>• Immediate matching with compatible roommates</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => setUseInteractive(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Talk with Rooma
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setUseOmnidim(true)}
                variant="outline"
                className="border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/20 px-8 py-3 rounded-full text-lg font-medium"
              >
                <Mic className="w-5 h-5 mr-2" />
                Advanced Setup
              </Button>
            </div>
            
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
              <p><strong>Talk with Rooma:</strong> Interactive voice chat with real-time speech</p>
              <p><strong>Advanced Setup:</strong> Backend voice processing system</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}