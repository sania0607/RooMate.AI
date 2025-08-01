import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  X, 
  MapPin, 
  Star, 
  Clock, 
  MessageCircle,
  Eye,
  Coffee,
  Moon,
  Users,
  Volume2,
  Home,
  DollarSign,
  Briefcase,
  GraduationCap,
  Sparkles,
  PawPrint,
  Cigarette,
  Wine,
  ChefHat,
  Building2,
  Calendar,
  Music,
  UserCheck
} from "lucide-react";
import type { UserProfile } from "@shared/schema";

interface UserCardProps {
  profile: UserProfile & {
    user?: {
      name: string;
      profileImageUrl?: string;
    };
  };
  onLike: () => void;
  onPass: () => void;
  onMessage?: () => void;
  className?: string;
  showActions?: boolean;
  compatibilityScore?: number;
}

export default function UserCard({ 
  profile, 
  onLike, 
  onPass, 
  onMessage, 
  className = "", 
  showActions = true,
  compatibilityScore 
}: UserCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Safely get user name with fallback
  const userName = profile.name || profile.user?.name || "User";
  const userAge = profile.age;
  const userLocation = profile.location;
  const userOccupation = profile.occupation;
  const userEducation = profile.education;
  const userBio = profile.bio;
  const userBudget = profile.budget;
  const userInterests = profile.interests || [];
  const userTags = profile.tags || [];
  const profileImage = profile.profileImageUrl || profile.user?.profileImageUrl;

  // Extract lifestyle data safely with proper typing
  const lifestyle = profile.lifestyle || {} as NonNullable<typeof profile.lifestyle>;
  const roommate = profile.roommatePreferences || {} as NonNullable<typeof profile.roommatePreferences>;

  // Helper function to get lifestyle tag color
  const getTagColor = (tag: string) => {
    const colors = {
      'Clean': 'bg-blue-100 text-blue-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Quiet': 'bg-purple-100 text-purple-800',
      'Night Owl': 'bg-indigo-100 text-indigo-800',
      'Early Bird': 'bg-yellow-100 text-yellow-800',
      'Cooking': 'bg-orange-100 text-orange-800',
      'Pet Friendly': 'bg-green-100 text-green-800',
      'Work from Home': 'bg-gray-100 text-gray-800',
      'Fitness': 'bg-red-100 text-red-800',
      'Artsy': 'bg-purple-100 text-purple-800',
      'Techy': 'bg-blue-100 text-blue-800'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Helper function to get sleep schedule display
  const getSleepSchedule = () => {
    if (lifestyle.sleepTime && lifestyle.wakeTime) {
      return `${lifestyle.sleepTime} - ${lifestyle.wakeTime}`;
    }
    if (roommate.preferredSleepSchedule) {
      const schedules = {
        'early_bird': 'Early Bird',
        'night_owl': 'Night Owl',
        'flexible': 'Flexible'
      };
      return schedules[roommate.preferredSleepSchedule as keyof typeof schedules] || 'Flexible';
    }
    return null;
  };

  // Helper function to get room type display
  const getRoomType = () => {
    const types = {
      'twin': 'Twin Room',
      'single': 'Single Room',
      'no_preference': 'No Preference'
    };
    return lifestyle.roomType ? types[lifestyle.roomType] : null;
  };

  return (
    <Card className={`w-full max-w-sm mx-auto overflow-hidden bg-white/95 backdrop-blur-sm border-0 shadow-2xl transition-all duration-300 hover:shadow-3xl ${className}`}>
      {/* Header with Profile Image */}
      <div className="relative h-80 bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400">
        {profileImage ? (
          <img
            src={profileImage}
            alt={userName}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-32 h-32">
              <AvatarFallback className="text-6xl font-bold bg-white/20 text-white">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        
        {/* Compatibility Score Badge */}
        {compatibilityScore && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/90 text-gray-800 font-bold px-3 py-1 text-sm">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              {compatibilityScore}%
            </Badge>
          </div>
        )}

        {/* Gradient Overlay for Name */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6">
          <div className="text-white">
            <h3 className="text-2xl font-bold mb-1">{userName}</h3>
            <div className="flex items-center space-x-4 text-white/90">
              {userAge && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {userAge}
                </span>
              )}
              {userLocation && (
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {userLocation}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Basic Info */}
        <div className="space-y-2">
          {userOccupation && (
            <div className="flex items-center text-gray-700">
              <Briefcase className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">{userOccupation}</span>
            </div>
          )}
          {userEducation && (
            <div className="flex items-center text-gray-700">
              <GraduationCap className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">{userEducation}</span>
            </div>
          )}
          {userBudget && (
            <div className="flex items-center text-gray-700">
              <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
              <span className="text-sm font-medium">{userBudget}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {userBio && (
          <div className="border-l-4 border-purple-400 pl-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
              {userBio}
            </p>
          </div>
        )}

        {/* Lifestyle Quick Facts */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-gray-100">
          {lifestyle.cleanliness && (
            <div className="text-center">
              <Sparkles className="w-5 h-5 mx-auto text-blue-500 mb-1" />
              <div className="text-xs text-gray-500">Clean</div>
              <div className="text-sm font-medium">{lifestyle.cleanliness}/5</div>
            </div>
          )}
          {lifestyle.socialLevel && (
            <div className="text-center">
              <Users className="w-5 h-5 mx-auto text-pink-500 mb-1" />
              <div className="text-xs text-gray-500">Social</div>
              <div className="text-sm font-medium">{lifestyle.socialLevel}/5</div>
            </div>
          )}
          {getSleepSchedule() && (
            <div className="text-center">
              <Moon className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
              <div className="text-xs text-gray-500">Sleep</div>
              <div className="text-xs font-medium">{getSleepSchedule()}</div>
            </div>
          )}
        </div>

        {/* Show More/Less Button */}
        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          {showDetails ? 'Less Details' : 'More Details'}
        </Button>

        {/* Detailed Information */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Lifestyle Details */}
            {(lifestyle.pets || lifestyle.smoking || lifestyle.drinking || lifestyle.cooking) && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Home className="w-4 h-4 mr-2" />
                  Lifestyle
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {lifestyle.pets && (
                    <div className="flex items-center text-green-600">
                      <PawPrint className="w-3 h-3 mr-1" />
                      <span>Pet Friendly</span>
                    </div>
                  )}
                  {lifestyle.cooking && (
                    <div className="flex items-center text-orange-600">
                      <ChefHat className="w-3 h-3 mr-1" />
                      <span>Loves Cooking</span>
                    </div>
                  )}
                  {lifestyle.smoking && (
                    <div className="flex items-center text-gray-600">
                      <Cigarette className="w-3 h-3 mr-1" />
                      <span>Smoker</span>
                    </div>
                  )}
                  {lifestyle.drinking && (
                    <div className="flex items-center text-purple-600">
                      <Wine className="w-3 h-3 mr-1" />
                      <span>Social Drinker</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Living Preferences */}
            {(lifestyle.roomType || lifestyle.floorType || lifestyle.guestPolicy) && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Living Preferences
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {getRoomType() && <div>• {getRoomType()}</div>}
                  {lifestyle.floorType && lifestyle.floorType !== 'no_preference' && (
                    <div>• {lifestyle.floorType === 'quiet' ? 'Quiet Floor' : 'Lively Floor'}</div>
                  )}
                  {lifestyle.guestPolicy && (
                    <div>• Guests: {lifestyle.guestPolicy}</div>
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {userInterests.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Coffee className="w-4 h-4 mr-2" />
                  Interests
                </h4>
                <div className="flex flex-wrap gap-1">
                  {userInterests.slice(0, 6).map((interest, index) => (
                    <Badge 
                      key={index}
                      variant="secondary" 
                      className="text-xs px-2 py-1"
                    >
                      {interest}
                    </Badge>
                  ))}
                  {userInterests.length > 6 && (
                    <Badge variant="outline" className="text-xs px-2 py-1">
                      +{userInterests.length - 6} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Lifestyle Tags */}
            {userTags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lifestyle Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {userTags.map((tag, index) => (
                    <Badge 
                      key={index}
                      className={`text-xs px-2 py-1 ${getTagColor(tag)}`}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Roommate Preferences */}
            {(roommate.ageRange || roommate.budgetRange) && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Looking For
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {roommate.ageRange && (
                    <div>• Age: {roommate.ageRange[0]}-{roommate.ageRange[1]} years</div>
                  )}
                  {roommate.budgetRange && (
                    <div>• Budget: ${roommate.budgetRange[0]}-${roommate.budgetRange[1]}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex space-x-3 pt-4">
            <Button
              onClick={onPass}
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <X className="w-4 h-4 mr-2" />
              Pass
            </Button>
            {onMessage && (
              <Button
                onClick={onMessage}
                variant="outline"
                className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            )}
            <Button
              onClick={onLike}
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
            >
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}