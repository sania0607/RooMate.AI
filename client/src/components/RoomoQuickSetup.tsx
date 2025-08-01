import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Sparkles, ArrowRight } from "lucide-react";
import { WebVoiceAssistant } from "@/components/WebVoiceAssistant";

interface RoomoQuickSetupProps {
  className?: string;
}

export function RoomoQuickSetup({ className }: RoomoQuickSetupProps) {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);

  const handleVoiceComplete = (profileData: any) => {
    console.log('Voice setup completed with data:', profileData);
    setShowVoiceAssistant(false);
  };

  return (
    <>
      <Card className={`border-dashed border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
            <Sparkles className="h-5 w-5" />
            Quick Voice Setup
          </CardTitle>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            Chat with Rooma, our AI voice assistant, to complete your profile in minutes
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Rooma will ask you about your lifestyle, preferences, and what you're looking for in a roommate. 
              Just speak naturally - she'll handle the rest!
            </p>
            <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
              <p>• 5-10 minute friendly conversation</p>
              <p>• Automatically fills out your entire profile</p>
              <p>• Starts matching you with compatible roommates</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowVoiceAssistant(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <Mic className="w-5 h-5" />
            Start Voice Setup
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      {showVoiceAssistant && (
        <WebVoiceAssistant 
          onClose={() => setShowVoiceAssistant(false)}
          onComplete={handleVoiceComplete}
        />
      )}
    </>
  );
}