import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Heart, MessageCircle, Star, Sparkles } from "lucide-react";

interface MatchModalProps {
  match: any;
  onClose: () => void;
  onMessage: () => void;
  onContinue: () => void;
}

export default function MatchModal({ match, onClose, onMessage, onContinue }: MatchModalProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  const otherUser = match.user1Id !== match.currentUserId ? match.user1 : match.user2;
  const compatibilityScore = match.compatibilityScore || 0;

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Generate confetti elements
  const confettiElements = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="confetti absolute w-2 h-2 bg-yellow-300 rounded-full"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 2}s`,
        animationDuration: `${2 + Math.random() * 2}s`,
      }}
    />
  ));

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-2xl overflow-hidden text-white relative border-0">
        {/* Confetti Effect */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiElements}
          </div>
        )}
        
        <div className="p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Heart className="w-16 h-16 text-white animate-pulse" />
                <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 animate-spin" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">It's a Match!</h3>
            <p className="text-primary-light">
              You and {otherUser?.firstName} both swiped right ✨
            </p>
          </div>
          
          {/* Match Profiles */}
          <div className="flex justify-center items-center space-x-4 mb-8">
            {/* Current user placeholder */}
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white">
                <AvatarFallback className="bg-white text-primary">
                  You
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Heart connector */}
            <div className="relative">
              <Heart className="w-8 h-8 text-white animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Heart className="w-8 h-8 text-white opacity-30" />
              </div>
            </div>
            
            {/* Matched user */}
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-white">
                <AvatarImage src={otherUser?.profileImageUrl} />
                <AvatarFallback className="bg-white text-primary">
                  {otherUser?.firstName?.[0]}{otherUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Match Info */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold text-lg">{compatibilityScore}% Compatible</span>
                <Star className="w-5 h-5 text-yellow-300" />
              </div>
              <p className="text-sm text-primary-light">
                You both have amazing compatibility! 🎉
              </p>
            </div>

            <div className="text-sm text-primary-light">
              <p className="mb-1">✓ Similar lifestyle preferences</p>
              <p className="mb-1">✓ Compatible schedules</p>
              <p>✓ Shared interests</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onMessage}
              className="w-full bg-white text-primary font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="mr-2 w-5 h-5" />
              Start Conversation
            </Button>
            <Button 
              onClick={onContinue}
              variant="outline"
              className="w-full border-white/50 text-white font-semibold py-3 rounded-xl hover:bg-white/10 transition-colors border-2"
            >
              Keep Swiping
            </Button>
          </div>

          {/* Match Tips */}
          <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
            <h4 className="font-semibold text-sm mb-2">💡 Conversation Starter Ideas:</h4>
            <div className="text-xs text-primary-light space-y-1">
              <p>• Ask about their favorite spots in {otherUser?.profile?.location}</p>
              <p>• Share what made you swipe right</p>
              <p>• Discuss your living preferences</p>
            </div>
          </div>
        </div>

        {/* Subtle Animation Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-16 h-16 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-5 w-12 h-12 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
