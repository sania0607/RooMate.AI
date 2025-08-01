import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MessageCircle, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  DollarSign, 
  Heart, 
  Home, 
  Users, 
  Moon, 
  Coffee, 
  Music, 
  Cigarette, 
  Wine, 
  PawPrint,
  Phone,
  AlertTriangle,
  Globe,
  User,
  Star,
  Sparkles,
  Calendar,
  Shield
} from "lucide-react";

interface UserDetailModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onMessage: () => void;
}

export default function UserDetailModal({ user, isOpen, onClose, onMessage }: UserDetailModalProps) {
  if (!user) return null;

  // Better data extraction - handle both direct user data and nested profile data
  const profile = user.profile || user;
  const userName = profile.name || user.name || "User";
  const profileImage = profile.profileImageUrl || user.profileImageUrl;
  const userAge = profile.age;
  const userLocation = profile.location;
  const userOccupation = profile.occupation;
  const userEducation = profile.education;
  const userBio = profile.bio;
  const userBudget = profile.budget;
  const userPhoneNumber = profile.phoneNumber;
  const userEmergencyContact = profile.emergencyContact;
  const userLanguages = profile.languages || [];
  const userInterests = profile.interests || [];
  
  const lifestyle = profile.lifestyle || {};
  const preferences = profile.roommatePreferences || {};

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-white/95 to-gray-50/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 rounded-t-lg"></div>
          <DialogTitle className="text-2xl font-bold text-center relative z-10 flex items-center justify-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <span>Profile Details</span>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 relative z-10">
          {/* Header Section */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="w-32 h-32 mx-auto border-4 border-white shadow-xl">
                    <AvatarImage 
                      src={profileImage} 
                      alt={userName}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Compatibility Score Badge */}
                  {user.compatibilityScore && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold px-3 py-2 shadow-lg">
                        <Star className="w-4 h-4 mr-1" />
                        {user.compatibilityScore}%
                      </Badge>
                    </div>
                  )}
                  
                  {/* Online Status */}
                  <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg">
                    <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{userName}</h2>
                {userAge && (
                  <div className="flex items-center justify-center space-x-2 text-gray-600 text-lg">
                    <Calendar className="w-5 h-5" />
                    <span>{userAge} years old</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Show message if no profile data */}
          {!userLocation && !userOccupation && !userEducation && !userBio && !userBudget && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Profile Incomplete</h3>
              <p className="text-gray-500 text-sm">This user hasn't completed their profile yet. You can still send them a message!</p>
            </div>
          )}

          {/* Basic Information */}
          {(userLocation || userOccupation || userEducation || userBudget) && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userLocation && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{userLocation}</span>
                    </div>
                  )}
                  {userOccupation && (
                    <div className="flex items-center space-x-2">
                      <Briefcase className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{userOccupation}</span>
                    </div>
                  )}
                  {userEducation && (
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{userEducation}</span>
                    </div>
                  )}
                  {userBudget && (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">${userBudget} budget</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Bio */}
          {userBio && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">About</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{userBio}</p>
            </div>
          )}

          {/* Contact Information */}
          {(userPhoneNumber || userEmergencyContact) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Contact</h3>
              <div className="space-y-2">
                {userPhoneNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{userPhoneNumber}</span>
                  </div>
                )}
                {userEmergencyContact && (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Emergency: {userEmergencyContact}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Languages */}
          {userLanguages.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {userLanguages.map((language: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>{language}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {userInterests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {userInterests.map((interest: string, index: number) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{interest}</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Lifestyle Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Lifestyle</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {lifestyle.sleepTime && (
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Sleep: {lifestyle.sleepTime}</span>
                </div>
              )}
              {lifestyle.wakeTime && (
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Wake: {lifestyle.wakeTime}</span>
                </div>
              )}
              {lifestyle.workSchedule && (
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{lifestyle.workSchedule}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <PawPrint className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{lifestyle.pets ? `Has pets${lifestyle.petType ? ` (${lifestyle.petType})` : ''}` : 'No pets'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cigarette className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{lifestyle.smoking ? 'Smoker' : 'Non-smoker'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wine className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {lifestyle.drinking 
                    ? `Drinks${lifestyle.drinkingFrequency ? ` (${lifestyle.drinkingFrequency})` : ''}`
                    : 'Non-drinker'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Lifestyle Tags */}
          {lifestyle.lifestyleTags && lifestyle.lifestyleTags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lifestyle Tags</h3>
              <div className="flex flex-wrap gap-2">
                {lifestyle.lifestyleTags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Roommate Preferences */}
          {(preferences.ageRange || preferences.budgetRange || preferences.locationRadius !== undefined) && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Roommate Preferences</h3>
              <div className="space-y-2 text-sm text-gray-700">
                {preferences.ageRange && (
                  <p>Age Range: {preferences.ageRange[0]} - {preferences.ageRange[1]} years</p>
                )}
                {preferences.budgetRange && (
                  <p>Budget Range: ${preferences.budgetRange[0]} - ${preferences.budgetRange[1]}</p>
                )}
                {preferences.locationRadius !== undefined && (
                  <p>Location Radius: {preferences.locationRadius} miles</p>
                )}
                {preferences.okWithPets !== undefined && (
                  <p>OK with pets: {preferences.okWithPets ? 'Yes' : 'No'}</p>
                )}
                {preferences.okWithSmoking !== undefined && (
                  <p>OK with smoking: {preferences.okWithSmoking ? 'Yes' : 'No'}</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200/50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex space-x-4">
                <Button 
                  onClick={onMessage}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
                <Button 
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 py-4 rounded-xl font-semibold transition-all duration-300"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}