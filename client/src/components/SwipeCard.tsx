import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  DollarSign,
  Heart,
  X,
  Star,
  Flag,
  CheckCircle,
  AlertCircle,
  Clock,
  Users
} from "lucide-react";

interface SwipeCardProps {
  candidate: any;
  onSwipe: (action: string) => void;
}

export default function SwipeCard({ candidate, onSwipe }: SwipeCardProps) {
  const [dragState, setDragState] = useState({ x: 0, y: 0, rotation: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const profile = candidate?.profile || {};
  const compatibilityScore = candidate?.compatibilityScore || 0;

  // Calculate red/green flags based on profile data
  const getCompatibilityFlags = () => {
    const greenFlags = [];
    const redFlags = [];

    if (profile.lifestyle?.cleanliness >= 4) greenFlags.push("Very Clean");
    if (profile.lifestyle?.cleanliness <= 2) redFlags.push("Messy");
    
    if (profile.lifestyle?.socialLevel <= 2) greenFlags.push("Quiet");
    if (profile.lifestyle?.socialLevel >= 4) redFlags.push("Very Social");
    
    if (profile.lifestyle?.smoking) redFlags.push("Smoker");
    if (!profile.lifestyle?.smoking) greenFlags.push("Non-Smoker");
    
    if (profile.lifestyle?.pets) greenFlags.push("Pet Friendly");
    
    if (profile.lifestyle?.sleepSchedule === "early") greenFlags.push("Early Bird");
    if (profile.lifestyle?.sleepSchedule === "late") redFlags.push("Night Owl");

    return { greenFlags, redFlags };
  };

  const { greenFlags, redFlags } = getCompatibilityFlags();

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    const rotation = deltaX * 0.1;

    setDragState({ x: deltaX, y: deltaY, rotation });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    setIsDragging(false);
    const threshold = 100;

    if (Math.abs(dragState.x) > threshold) {
      const action = dragState.x > 0 ? 'like' : 'pass';
      onSwipe(action);
    } else {
      // Snap back
      setDragState({ x: 0, y: 0, rotation: 0 });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    const rotation = deltaX * 0.1;

    setDragState({ x: deltaX, y: deltaY, rotation });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      const rotation = deltaX * 0.1;
      
      setDragState({ x: deltaX, y: deltaY, rotation });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragState.x]);

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "compatibility-high";
    if (score >= 60) return "compatibility-medium";
    return "compatibility-low";
  };

  const cardStyle = {
    transform: `translateX(${dragState.x}px) translateY(${dragState.y}px) rotate(${dragState.rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div className="swipe-card-stack">
      <Card 
        ref={cardRef}
        className="card max-w-sm mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden select-none"
        style={cardStyle}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Profile Image */}
        <div className="relative h-96">
          <div className="w-full h-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center">
            <Avatar className="w-48 h-48">
              <AvatarImage src={candidate.profileImageUrl} className="object-cover" />
              <AvatarFallback className="text-4xl bg-white text-primary">
                {candidate.firstName?.[0]}{candidate.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          
          {/* Compatibility Score */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
            <span className={`text-sm font-semibold ${
              compatibilityScore >= 80 ? 'text-secondary' : 
              compatibilityScore >= 60 ? 'text-yellow-600' : 'text-warning'
            }`}>
              {compatibilityScore}% Match
            </span>
          </div>
          
          {/* Flags */}
          <div className="absolute top-4 left-4 space-y-2">
            {greenFlags.slice(0, 2).map((flag, index) => (
              <div key={index} className="bg-secondary/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                <CheckCircle className="text-white w-3 h-3 mr-1" />
                <span className="text-xs text-white font-medium">{flag}</span>
              </div>
            ))}
            {redFlags.slice(0, 1).map((flag, index) => (
              <div key={index} className="bg-warning/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                <AlertCircle className="text-white w-3 h-3 mr-1" />
                <span className="text-xs text-white font-medium">{flag}</span>
              </div>
            ))}
          </div>

          {/* Swipe Indicators */}
          {isDragging && (
            <>
              {dragState.x > 50 && (
                <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                  <div className="bg-secondary rounded-full p-4">
                    <Heart className="text-white w-12 h-12" />
                  </div>
                </div>
              )}
              {dragState.x < -50 && (
                <div className="absolute inset-0 bg-gray-500/20 flex items-center justify-center">
                  <div className="bg-gray-500 rounded-full p-4">
                    <X className="text-white w-12 h-12" />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Profile Info */}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">
              {candidate.firstName}, {profile.age || '??'}
            </h3>
            <div className="flex items-center text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{profile.location || 'Location not specified'}</span>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            {profile.occupation && (
              <div className="flex items-center text-gray-600">
                <Briefcase className="w-4 h-4 mr-3" />
                <span>{profile.occupation}</span>
              </div>
            )}
            {profile.education && (
              <div className="flex items-center text-gray-600">
                <GraduationCap className="w-4 h-4 mr-3" />
                <span>{profile.education}</span>
              </div>
            )}
            {profile.budget && (
              <div className="flex items-center text-gray-600">
                <DollarSign className="w-4 h-4 mr-3" />
                <span>Budget: {profile.budget}</span>
              </div>
            )}
          </div>
          
          {/* Lifestyle Tags */}
          {profile.tags && profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {profile.tags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="secondary" className="bg-primary-light text-primary">
                  {tag}
                </Badge>
              ))}
              {profile.tags.length > 3 && (
                <Badge variant="outline">+{profile.tags.length - 3} more</Badge>
              )}
            </div>
          )}

          {/* Bio Preview */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-gray-600 text-sm line-clamp-3">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Lifestyle Indicators */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            {profile.lifestyle?.sleepSchedule && (
              <div>
                <Clock className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <div className="text-xs text-gray-500 capitalize">
                  {profile.lifestyle.sleepSchedule}
                </div>
              </div>
            )}
            {profile.lifestyle?.socialLevel && (
              <div>
                <Users className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <div className="text-xs text-gray-500">
                  Social: {profile.lifestyle.socialLevel}/5
                </div>
              </div>
            )}
            {profile.lifestyle?.cleanliness && (
              <div>
                <Star className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                <div className="text-xs text-gray-500">
                  Clean: {profile.lifestyle.cleanliness}/5
                </div>
              </div>
            )}
          </div>
          
          {/* More Details Button */}
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="outline"
            className="w-full mb-4"
          >
            {showDetails ? 'Less Details' : 'More Details'}
          </Button>

          {/* Extended Details */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Compatibility Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Lifestyle Match</span>
                    <span className="font-medium">{Math.min(100, compatibilityScore + 10)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Location</span>
                    <span className="font-medium">{Math.min(100, compatibilityScore + 5)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Budget</span>
                    <span className="font-medium">{Math.max(60, compatibilityScore - 5)}%</span>
                  </div>
                </div>
              </div>

              {(greenFlags.length > 2 || redFlags.length > 1) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">All Flags</h4>
                  <div className="space-y-2">
                    {greenFlags.map((flag, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <CheckCircle className="text-secondary w-4 h-4 mr-2" />
                        <span className="text-gray-600">{flag}</span>
                      </div>
                    ))}
                    {redFlags.map((flag, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <AlertCircle className="text-warning w-4 h-4 mr-2" />
                        <span className="text-gray-600">{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
