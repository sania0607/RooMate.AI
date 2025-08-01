import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  Coffee,
  Moon,
  PawPrint,
  Cigarette,
  Wine,
  Heart,
  Star,
  Sparkles 
} from "lucide-react";
import type { UserProfile } from "@shared/schema";

interface UserProfileCardProps {
  profile: UserProfile & {
    user?: {
      name: string;
      profileImageUrl?: string;
    };
    compatibilityScore?: number;
  };
  onMessage: () => void;
  onViewProfile: () => void;
  className?: string;
}

export default function UserProfileCard({ profile, onMessage, onViewProfile, className = "" }: UserProfileCardProps) {
  // Safely get user data with fallbacks
  const userName = profile.name || profile.user?.name || "User";
  const profileImage = profile.profileImageUrl || profile.user?.profileImageUrl;
  const userLocation = profile.location;
  const userOccupation = profile.occupation;
  const userBio = profile.bio;
  const lifestyle = profile.lifestyle as any || {};
  // Support top-level fields for new profile structure
  const getLifestyleField = (key: string) => {
    return lifestyle[key] !== undefined ? lifestyle[key] : (profile as any)[key];
  };
  const compatibilityScore = profile.compatibilityScore || Math.floor(Math.random() * 30) + 70;

  // Get lifestyle indicators
  const getLifestyleIndicators = () => {
    const indicators = [];
    if (getLifestyleField('cleanliness')) {
      indicators.push({ icon: Star, label: `Cleanliness: ${getLifestyleField('cleanliness')}/5`, color: "text-blue-600" });
    }
    if (getLifestyleField('socialLevel')) {
      indicators.push({ icon: Sparkles, label: `Social: ${getLifestyleField('socialLevel')}/5`, color: "text-green-600" });
    }
    if (getLifestyleField('pets')) {
      indicators.push({ icon: PawPrint, label: "Pet lover", color: "text-yellow-600" });
    }
    if (getLifestyleField('sleepTime')) {
      indicators.push({ icon: Moon, label: `Sleep: ${getLifestyleField('sleepTime')}`, color: "text-purple-600" });
    }
    if (getLifestyleField('roomType')) {
      indicators.push({ icon: Briefcase, label: `Room: ${getLifestyleField('roomType')}`, color: "text-pink-600" });
    }
    return indicators.slice(0, 3); // Show max 3 indicators
  };

  const lifestyleIndicators = getLifestyleIndicators();

  return (
    <div 
      className={`group relative cursor-pointer transform transition-all duration-300 hover:scale-105 ${className}`}
      onClick={onViewProfile}
    >
      <Card className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
        {/* Compatibility Score Badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-3 py-1 shadow-lg">
            <Star className="w-3 h-3 mr-1" />
            {compatibilityScore}%
          </Badge>
        </div>

        {/* Premium Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

        <CardContent className="p-6 relative z-10">
          {/* Profile Picture */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 scale-110"></div>
              <Avatar className="w-28 h-28 border-4 border-white shadow-lg relative z-10">
                {profileImage ? (
                  <AvatarImage 
                    src={profileImage} 
                    alt={userName}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Online Status Indicator */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full z-20 shadow-lg">
                <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Name and Age */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{userName}</h3>
              {profile.age && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 font-medium">{profile.age}</span>
                </>
              )}
            </div>
            
            {/* Location/Occupation */}
            <div className="flex items-center justify-center text-gray-600 text-sm space-x-3">
              {userLocation && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{userLocation}</span>
                </div>
              )}
              {userOccupation && (
                <div className="flex items-center space-x-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="truncate max-w-24">{userOccupation}</span>
                </div>
              )}
            </div>
            {/* Lifestyle Details */}
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {getLifestyleField('cleanliness') && (
                <Badge className="bg-blue-100 text-blue-700 text-xs">Cleanliness: {getLifestyleField('cleanliness')}/5</Badge>
              )}
              {getLifestyleField('socialLevel') && (
                <Badge className="bg-green-100 text-green-700 text-xs">Social: {getLifestyleField('socialLevel')}/5</Badge>
              )}
              {getLifestyleField('roomType') && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">Room: {getLifestyleField('roomType')}</Badge>
              )}
              {typeof getLifestyleField('pets') !== 'undefined' && (
                <Badge className="bg-yellow-100 text-yellow-700 text-xs">{getLifestyleField('pets') ? 'Has/likes pets' : 'No pets'}</Badge>
              )}
              {getLifestyleField('sleepTime') && (
                <Badge className="bg-indigo-100 text-indigo-700 text-xs">Sleeps: {getLifestyleField('sleepTime')}</Badge>
              )}
            </div>
          </div>

          {/* Bio Preview */}
          {userBio && (
            <div className="text-center mb-4">
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-2">
                {userBio.length > 80 ? userBio.substring(0, 80) + "..." : userBio}
              </p>
            </div>
          )}

          {/* Lifestyle Indicators */}
          {lifestyleIndicators.length > 0 && (
            <div className="flex justify-center space-x-4 mb-4">
              {lifestyleIndicators.map((indicator, index) => {
                const Icon = indicator.icon;
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div className={`p-2 rounded-full bg-gray-100 ${indicator.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interests Tags */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="flex justify-center mb-4">
              <div className="flex flex-wrap gap-1 justify-center max-w-full">
                {profile.interests.slice(0, 3).map((interest: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-purple-100 text-purple-700">
                    {interest}
                  </Badge>
                ))}
                {profile.interests.length > 3 && (
                  <Badge variant="secondary" className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                    +{profile.interests.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onMessage();
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
          </div>

          {/* Floating Sparkles Effect */}
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Heart className="w-4 h-4 text-pink-400 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}