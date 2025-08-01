import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import VoiceInput from "@/components/VoiceInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, Mic } from "lucide-react";

export default function VoiceProfileSetup() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [completionPercentage] = useState(100); // Since we're at the voice input step
  const [extractedData, setExtractedData] = useState<any>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("POST", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated Successfully",
        description: "Your voice input has been processed and your profile has been updated!",
      });
      setLocation("/profile");
    },
    onError: (error) => {
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
      toast({
        title: "Profile Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVoiceData = (data: any) => {
    if (data.profileData) {
      setExtractedData(data.profileData);
      setStep(2); // Move to confirmation step
    }
  };

  const handleConfirmAndSave = () => {
    if (extractedData) {
      updateProfileMutation.mutate(extractedData);
    }
  };

  const handleSkipVoice = () => {
    setLocation("/profile");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950 dark:via-gray-900 dark:to-pink-950">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Profile Setup
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-6">
            Create your perfect roommate profile to find compatible matches
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Profile Completion</span>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-3 bg-purple-100 dark:bg-purple-900" />
          </div>

          {/* Voice Input Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button
              onClick={() => setStep(1)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
              disabled={step === 1}
            >
              <Mic className="w-5 h-5" />
              Use Voice Input
            </Button>
            
            <Button
              onClick={handleSkipVoice}
              variant="outline"
              className="px-8 py-3 rounded-full text-lg font-medium border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/20"
            >
              Fill Out Manually
            </Button>
          </div>
        </div>

        {/* Step Content */}
        {step === 1 && (
          <div className="space-y-8">
            {/* Voice Input Component */}
            <VoiceInput onResult={handleVoiceData} />
            
            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                onClick={() => setLocation("/profile")}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Profile
              </Button>
              
              <Button
                onClick={handleSkipVoice}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Skip Voice Setup
              </Button>
            </div>
          </div>
        )}

        {step === 2 && extractedData && (
          <div className="space-y-8">
            {/* Confirmation Step */}
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="w-6 h-6" />
                  Voice Processing Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-green-700 dark:text-green-300">
                  We've successfully extracted the following information from your voice input. 
                  Review the details below and click "Save Profile" to update your profile.
                </p>

                {/* Extracted Data Preview */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {extractedData.name && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Name</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.name}</p>
                    </div>
                  )}

                  {/* Lifestyle fields from voice setup */}
                  {typeof extractedData.cleanliness !== 'undefined' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Cleanliness</h4>
                      <p className="text-blue-700 dark:text-blue-300">{extractedData.cleanliness}/5</p>
                    </div>
                  )}
                  {typeof extractedData.socialLevel !== 'undefined' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">Social Level</h4>
                      <p className="text-green-700 dark:text-green-300">{extractedData.socialLevel}/5</p>
                    </div>
                  )}
                  {typeof extractedData.pets !== 'undefined' && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">Pets</h4>
                      <p className="text-yellow-700 dark:text-yellow-300">{extractedData.pets ? 'Has/likes pets' : 'No pets'}</p>
                    </div>
                  )}
                  {extractedData.sleepTime && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                      <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-1">Sleep Time</h4>
                      <p className="text-indigo-700 dark:text-indigo-300">{extractedData.sleepTime}</p>
                    </div>
                  )}
                  {extractedData.roomType && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                      <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Room Type</h4>
                      <p className="text-purple-700 dark:text-purple-300">{extractedData.roomType}</p>
                    </div>
                  )}

                  {extractedData.age && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Age</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.age} years old</p>
                    </div>
                  )}
                  
                  {extractedData.location && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Location</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.location}</p>
                    </div>
                  )}
                  
                  {extractedData.occupation && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Occupation</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.occupation}</p>
                    </div>
                  )}
                  
                  {extractedData.budget && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Budget</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.budget}</p>
                    </div>
                  )}

                  {extractedData.phoneNumber && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Phone Number</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.phoneNumber}</p>
                    </div>
                  )}

                  {extractedData.emergencyContact && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Emergency Contact</h4>
                      <p className="text-gray-600 dark:text-gray-400">{extractedData.emergencyContact}</p>
                    </div>
                  )}
                </div>

                {/* Languages */}
                {extractedData.languages && extractedData.languages.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Languages Spoken</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.languages.map((language: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                        >
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {extractedData.interests && extractedData.interests.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Interests & Hobbies</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.interests.map((interest: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle Tags */}
                {extractedData.tags && extractedData.tags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Lifestyle Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deal Breakers */}
                {extractedData.preferences?.dealBreakers && extractedData.preferences.dealBreakers.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Deal Breakers</h4>
                    <div className="flex flex-wrap gap-2">
                      {extractedData.preferences.dealBreakers.map((dealBreaker: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-sm font-medium"
                        >
                          No {dealBreaker}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={handleConfirmAndSave}
                    disabled={updateProfileMutation.isPending}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                  </Button>
                  
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="px-8 py-3 rounded-lg font-medium border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Record Again
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Recording
              </Button>
              
              <Button
                onClick={() => setLocation("/profile")}
                className="flex items-center gap-2"
              >
                Continue to Profile
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}