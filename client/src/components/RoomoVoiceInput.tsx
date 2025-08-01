import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import VoiceInput from "@/components/VoiceInput";
import { omnidimService } from "@/services/omnidimService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MessageSquare, Sparkles, X } from "lucide-react";

interface RoomoVoiceInputProps {
  onClose: () => void;
}

export function RoomoVoiceInput({ onClose }: RoomoVoiceInputProps) {
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await apiRequest("POST", "/api/profile", profileData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated Successfully",
        description: "Your voice input has been processed and your profile has been updated with roomo preferences!",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Profile Update Failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVoiceData = async (data: any) => {
    if (data.profileData) {
      setExtractedData(data.profileData);
      setIsProcessed(true);

      // If the transcription contains "roomo", save it via Omnidim service
      if (data.transcription && data.transcription.toLowerCase().includes('roomo')) {
        try {
          await omnidimService.manualSaveResponse(
            "Tell us about your ideal roommate preferences:",
            data.transcription,
            {
              source: 'roomo_voice_input',
              profileSetup: true,
              extractedData: data.profileData
            }
          );
        } catch (error) {
          console.error('Failed to save roomo response:', error);
        }
      }
    }
  };

  const handleConfirmAndSave = () => {
    if (extractedData) {
      updateProfileMutation.mutate(extractedData);
    }
  };

  const getRoomoInsights = () => {
    if (!extractedData) return [];
    
    const insights = [];
    if (extractedData.roomoResponses?.length > 0) {
      insights.push("Roomo-compatible preferences detected");
    }
    if (extractedData.interests?.includes('Roomo Community')) {
      insights.push("Interested in Roomo Community");
    }
    if (extractedData.interests?.includes('Roomo Lifestyle')) {
      insights.push("Aligned with Roomo Lifestyle");
    }
    if (extractedData.tags?.includes('roomo-compatible')) {
      insights.push("Tagged as roomo-compatible");
    }
    return insights;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Sparkles className="h-5 w-5" />
            Quick Voice Setup with Roomo Integration
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isProcessed ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Roomo Voice Setup:</strong> Tell us about your ideal roommate preferences. 
                    Mention "roomo" to get special roomo-compatible matching features!
                  </p>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Try saying:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>"I'm looking for a roomo-compatible roommate who is clean and quiet"</li>
                      <li>"I prefer someone interested in roomo lifestyle and community activities"</li>
                      <li>"I want a roommate who shares roomo values and interests"</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <VoiceInput onResult={handleVoiceData} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="text-white w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Voice Input Processed Successfully!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  We've extracted your preferences and detected roomo compatibility features.
                </p>
              </div>

              {/* Roomo Insights */}
              {getRoomoInsights().length > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Roomo Compatibility Detected
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {getRoomoInsights().map((insight, index) => (
                      <Badge key={index} className="bg-orange-100 text-orange-800 border-orange-300">
                        {insight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Profile Data Preview */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Extracted Profile Information:
                </h4>
                <div className="space-y-2 text-sm">
                  {extractedData.name && (
                    <div><strong>Name:</strong> {extractedData.name}</div>
                  )}
                  {extractedData.age && (
                    <div><strong>Age:</strong> {extractedData.age}</div>
                  )}
                  {extractedData.location && (
                    <div><strong>Location:</strong> {extractedData.location}</div>
                  )}
                  {extractedData.interests?.length > 0 && (
                    <div>
                      <strong>Interests:</strong> {extractedData.interests.join(', ')}
                    </div>
                  )}
                  {extractedData.languages?.length > 0 && (
                    <div>
                      <strong>Languages:</strong> {extractedData.languages.join(', ')}
                    </div>
                  )}
                  {extractedData.tags?.length > 0 && (
                    <div>
                      <strong>Tags:</strong> {extractedData.tags.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleConfirmAndSave}
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-2"
                >
                  {updateProfileMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  {updateProfileMutation.isPending ? "Updating..." : "Save to Profile"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6 py-2"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}