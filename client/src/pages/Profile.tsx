import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Edit, Save, X, Camera, MapPin, Calendar, Briefcase, Upload, Loader2, Clock, Home, Users, Heart, Sparkles, DollarSign, Coffee, Moon, Sun, Utensils, Music, Volume2, Bed, Building2, GraduationCap, Phone, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { insertUserProfileSchema, type UserProfile } from '@shared/schema';
import Navigation from '@/components/Navigation';
import { RoomoQuickSetup } from '@/components/RoomoQuickSetup';

// Form validation schema based on the actual UserProfile schema
const profileFormSchema = insertUserProfileSchema.extend({
  // Make userId optional for updates
  userId: z.string().optional(),
  
  // Lifestyle structure
  lifestyle: z.object({
    cleanliness: z.number().min(1).max(5).optional(),
    socialLevel: z.number().min(1).max(5).optional(),
    sleepTime: z.string().optional(),
    wakeTime: z.string().optional(),
    workSchedule: z.string().optional(),
    pets: z.boolean().optional(),
    petType: z.string().optional(),
    smoking: z.boolean().optional(),
    drinking: z.boolean().optional(),
    drinkingFrequency: z.string().optional(),
    roomType: z.enum(['twin', 'single', 'no_preference']).optional(),
    floorType: z.enum(['quiet', 'lively', 'no_preference']).optional(),
    cooking: z.boolean().optional(),
    musicLevel: z.number().min(1).max(5).optional(),
    lifestyleTags: z.array(z.string()).optional(),
    guestPolicy: z.enum(['frequently', 'occasionally', 'rarely', 'never']).optional(),
  }).optional(),
  
  // Roommate preferences structure
  roommatePreferences: z.object({
    preferredCleanliness: z.string().max(100).optional(),
    preferredSocialLevel: z.string().max(100).optional(),
    okWithPets: z.boolean().optional(),
    okWithSmoking: z.boolean().optional(),
    preferredSleepSchedule: z.string().max(100).optional(),
    preferredGuestPolicy: z.enum(['frequently', 'occasionally', 'rarely', 'never']).optional(),
    interestMatching: z.enum(['very_important', 'somewhat_important', 'not_important']).optional(),
    ageRange: z.tuple([z.number(), z.number()]).optional(),
    locationRadius: z.number().optional(),
    budgetRange: z.tuple([z.number(), z.number()]).optional(),
    dealBreakers: z.array(z.string()).optional(),
    mustHaves: z.array(z.string()).optional(),
  }).optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

// Predefined options matching the schema
const LIFESTYLE_TAGS = [
  'Artsy', 'Techy', 'Fitness-focused', 'Bookworm', 'Social Butterfly',
  'Homebody', 'Minimalist', 'Plant Parent', 'Chef', 'Gamer', 'Student',
  'Professional', 'Traveler', 'Music Lover', 'Movie Buff', 'Early Riser',
  'Night Owl', 'Outdoorsy', 'Creative', 'Academic'
];

const INTERESTS = [
  'Reading', 'Cooking', 'Gaming', 'Sports', 'Music', 'Movies', 'Art', 'Travel',
  'Photography', 'Hiking', 'Yoga', 'Dancing', 'Writing', 'Technology', 'Fashion',
  'Gardening', 'Volunteering', 'Learning Languages', 'Fitness', 'Board Games'
];

const CLEANLINESS_LEVELS = [
  { value: 1, label: 'Very Relaxed' },
  { value: 2, label: 'Relaxed' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Clean' },
  { value: 5, label: 'Very Clean' }
];

const SOCIAL_LEVELS = [
  { value: 1, label: 'Very Quiet' },
  { value: 2, label: 'Quiet' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Social' },
  { value: 5, label: 'Very Social' }
];

const MUSIC_LEVELS = [
  { value: 1, label: 'Very Quiet' },
  { value: 2, label: 'Quiet' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Loud' },
  { value: 5, label: 'Very Loud' }
];

const WORK_SCHEDULES = [
  '9-5 Weekdays', 'Flexible', 'Remote', 'Night Shift', 'Weekend Work', 'Student Schedule'
];

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room' },
  { value: 'twin', label: 'Twin/Shared Room' },
  { value: 'no_preference', label: 'No Preference' }
];

const FLOOR_TYPES = [
  { value: 'quiet', label: 'Quiet Floor' },
  { value: 'lively', label: 'Lively Floor' },
  { value: 'no_preference', label: 'No Preference' }
];

const GUEST_POLICIES = [
  { value: 'frequently', label: 'Guests Frequently' },
  { value: 'occasionally', label: 'Guests Occasionally' },
  { value: 'rarely', label: 'Guests Rarely' },
  { value: 'never', label: 'No Guests' }
];

const SLEEP_SCHEDULES = [
  { value: 'early_bird', label: 'Early Bird (Before 10 PM)' },
  { value: 'night_owl', label: 'Night Owl (After 11 PM)' },
  { value: 'flexible', label: 'Flexible' }
];

const DRINKING_FREQUENCIES = [
  'Never', 'Occasionally', 'Socially', 'Regularly', 'Daily'
];

const IMPORTANCE_LEVELS = [
  { value: 'high', label: 'Very Important' },
  { value: 'medium', label: 'Somewhat Important' },
  { value: 'low', label: 'Not Important' }
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'lifestyle' | 'roommate'>('basic');
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photo upload handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setPhotoUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          const response = await fetch('/api/upload/profile-photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              image: base64,
              filename: file.name 
            }),
          });

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const result = await response.json();
          
          // Update the form with the new image URL
          form.setValue('profileImageUrl', result.imageUrl);
          
          // Invalidate and refetch profile data to show updated photo
          queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
          
          toast({
            title: 'Photo uploaded',
            description: 'Your profile photo has been updated successfully.',
          });
        } catch (error) {
          console.error('Upload error:', error);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload photo. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setPhotoUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File read error:', error);
      setPhotoUploading(false);
      toast({
        title: 'Upload failed',
        description: 'Failed to read the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: !!user,
  });

  // Form setup
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      age: undefined,
      gender: '',
      occupation: '',
      bio: '',
      location: '',
      education: '',
      budget: '',
      phoneNumber: '',
      emergencyContact: '',
      languages: [],
      interests: [],
      profileImageUrl: '',
      additionalPhotos: [],
      ageRange: '',
      lifestyle: {
        cleanliness: undefined,
        socialLevel: undefined,
        sleepTime: '',
        wakeTime: '',
        workSchedule: '',
        pets: false,
        petType: '',
        smoking: false,
        drinking: false,
        drinkingFrequency: '',
        roomType: undefined,
        floorType: undefined,
        cooking: false,
        musicLevel: undefined,
        lifestyleTags: [],
        guestPolicy: undefined,
      },
      roommatePreferences: {
        preferredCleanliness: undefined,
        preferredSocialLevel: undefined,
        okWithPets: false,
        okWithSmoking: false,
        preferredSleepSchedule: undefined,
        preferredGuestPolicy: undefined,
        interestMatching: undefined,
        ageRange: [18, 35],
        locationRadius: 10,
        budgetRange: [500, 2000],
        dealBreakers: [],
        mustHaves: [],
      },
      tags: [],
      isComplete: false,
      isActive: true,
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      // Debug log: inspect the profile data received from the backend/API
      console.log('[Profile Debug] Loaded profile data:', profile);
      form.reset({
        ...profile,
        lifestyle: profile.lifestyle || {
          cleanliness: undefined,
          socialLevel: undefined,
          sleepTime: '',
          wakeTime: '',
          workSchedule: '',
          pets: false,
          petType: '',
          smoking: false,
          drinking: false,
          drinkingFrequency: '',
          roomType: undefined,
          floorType: undefined,
          cooking: false,
          musicLevel: undefined,
          lifestyleTags: [],
          guestPolicy: undefined,
        },
        roommatePreferences: profile.roommatePreferences
          ? {
              ...profile.roommatePreferences,
              preferredCleanliness: profile.roommatePreferences.preferredCleanliness !== undefined
                ? profile.roommatePreferences.preferredCleanliness.toString()
                : '',
              preferredSocialLevel: profile.roommatePreferences.preferredSocialLevel !== undefined
                ? profile.roommatePreferences.preferredSocialLevel.toString()
                : '',
              preferredSleepSchedule: profile.roommatePreferences.preferredSleepSchedule !== undefined
                ? profile.roommatePreferences.preferredSleepSchedule.toString()
                : '',
            }
          : {
          preferredCleanliness: undefined,
          preferredSocialLevel: undefined,
          okWithPets: false,
          okWithSmoking: false,
          preferredSleepSchedule: undefined,
          preferredGuestPolicy: undefined,
          interestMatching: undefined,
          ageRange: [18, 35],
          locationRadius: 10,
          budgetRange: [500, 2000],
          dealBreakers: [],
          mustHaves: [],
        },
        interests: profile.interests || [],
        languages: profile.languages || [],
        additionalPhotos: profile.additionalPhotos || [],
        tags: profile.tags || [],
      });
    }
  }, [profile, form]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => 
      apiRequest('/api/profile', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleLifestyleTagToggle = (tag: string) => {
    const currentLifestyle = form.getValues('lifestyle') || {};
    const currentTags = currentLifestyle.lifestyleTags || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    form.setValue('lifestyle', { ...currentLifestyle, lifestyleTags: updatedTags });
  };

  const handleInterestToggle = (interest: string) => {
    const currentInterests = form.getValues('interests') || [];
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    form.setValue('interests', updatedInterests);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse border-0 bg-white/60 backdrop-blur-sm shadow-xl">
                <CardHeader>
                  <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-pink-100 to-orange-100 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Profile Header Card */}
        <div className="relative mb-12 overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 p-8">
            {/* Main Profile Section */}
            <div className="flex flex-col lg:flex-row items-start justify-between space-y-6 lg:space-y-0 mb-8">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white/30 shadow-2xl">
                    <AvatarImage src={profile?.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-white/20 text-white text-3xl">
                      {profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {profile?.profileImageUrl && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold">{profile?.name || 'Your Profile'} ✨</h1>
                  <div className="flex flex-wrap gap-3 text-white/90">
                    {profile?.age && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">Age {profile.age}</span>
                      </div>
                    )}
                    {profile?.gender && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <User className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium capitalize">{profile.gender}</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{profile.location}</span>
                      </div>
                    )}
                    {profile?.occupation && (
                      <div className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                        <Briefcase className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{profile.occupation}</span>
                      </div>
                    )}
                  </div>
                  {profile?.bio && (
                    <p className="text-white/80 text-lg max-w-md leading-relaxed">
                      {profile.bio.slice(0, 120) + (profile.bio.length > 120 ? '...' : '')}
                    </p>
                  )}
                </div>
              </div>
              
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-sm shadow-xl px-6 py-3 rounded-2xl transition-all duration-300"
                variant="outline"
              >
                {isEditing ? (
                  <>
                    <X className="h-5 w-5 mr-2" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 mr-2" />
                    <span>Edit Profile</span>
                  </>
                )}
              </Button>
            </div>

            {/* Comprehensive Profile Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Basic Info Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center mb-4">
                  <User className="h-5 w-5 mr-3 text-white/80" />
                  <h3 className="text-lg font-semibold">Basic Info</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {profile?.education && (
                    <div className="flex items-center">
                      <GraduationCap className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">{profile.education}</span>
                    </div>
                  )}
                  {profile?.budget && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">{profile.budget}</span>
                    </div>
                  )}
                  {profile?.phoneNumber && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">{profile.phoneNumber.slice(0, 8)}***</span>
                    </div>
                  )}
                  {profile?.emergencyContact && (
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">Emergency contact added</span>
                    </div>
                  )}
                  {(!profile?.education && !profile?.budget && !profile?.phoneNumber && !profile?.emergencyContact) && (
                    <p className="text-white/60 italic">Complete your basic info</p>
                  )}
                </div>
              </div>

              {/* Lifestyle Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center mb-4">
                  <Coffee className="h-5 w-5 mr-3 text-white/80" />
                  <h3 className="text-lg font-semibold">Lifestyle</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {(profile?.lifestyle?.sleepTime || profile?.lifestyle?.wakeTime) && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        {profile.lifestyle.sleepTime && profile.lifestyle.wakeTime ? 
                          `Sleep ${profile.lifestyle.sleepTime} - Wake ${profile.lifestyle.wakeTime}` :
                          profile.lifestyle.sleepTime ? `Sleep ${profile.lifestyle.sleepTime}` :
                          `Wake ${profile.lifestyle.wakeTime}`
                        }
                      </span>
                    </div>
                  )}
                  {profile?.lifestyle?.cleanliness && (
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        Cleanliness: {CLEANLINESS_LEVELS.find(l => l.value === profile.lifestyle?.cleanliness)?.label}
                      </span>
                    </div>
                  )}
                  {profile?.lifestyle?.socialLevel && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        Social: {SOCIAL_LEVELS.find(l => l.value === profile.lifestyle?.socialLevel)?.label}
                      </span>
                    </div>
                  )}
                  {profile?.lifestyle?.workSchedule && (
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">{profile.lifestyle.workSchedule}</span>
                    </div>
                  )}
                  {(profile?.lifestyle?.pets || profile?.lifestyle?.smoking || profile?.lifestyle?.drinking) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.lifestyle.pets && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          🐾 Pet-friendly
                        </Badge>
                      )}
                      {profile.lifestyle.smoking && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          🚬 Smoking
                        </Badge>
                      )}
                      {profile.lifestyle.drinking && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          🍷 Social Drinking
                        </Badge>
                      )}
                    </div>
                  )}
                  {(!profile?.lifestyle?.sleepTime && !profile?.lifestyle?.wakeTime && !profile?.lifestyle?.cleanliness && !profile?.lifestyle?.socialLevel) && (
                    <p className="text-white/60 italic">Add your lifestyle preferences</p>
                  )}
                </div>
              </div>

              {/* Roommate Preferences Card */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center mb-4">
                  <Home className="h-5 w-5 mr-3 text-white/80" />
                  <h3 className="text-lg font-semibold">Roommate Prefs</h3>
                </div>
                <div className="space-y-3 text-sm">
                  {profile?.roommatePreferences?.ageRange && (
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        Age {profile.roommatePreferences.ageRange[0]}-{profile.roommatePreferences.ageRange[1]}
                      </span>
                    </div>
                  )}
                  {profile?.roommatePreferences?.budgetRange && (
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        ${profile.roommatePreferences.budgetRange[0]}-${profile.roommatePreferences.budgetRange[1]}
                      </span>
                    </div>
                  )}
                  {profile?.lifestyle?.roomType && (
                    <div className="flex items-center">
                      <Bed className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        {ROOM_TYPES.find(t => t.value === profile.lifestyle?.roomType)?.label}
                      </span>
                    </div>
                  )}
                  {profile?.lifestyle?.floorType && (
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        {FLOOR_TYPES.find(t => t.value === profile.lifestyle?.floorType)?.label}
                      </span>
                    </div>
                  )}
                  {profile?.roommatePreferences?.preferredSleepSchedule && (
                    <div className="flex items-center">
                      <Moon className="h-4 w-4 mr-3 text-white/70" />
                      <span className="text-white/90">
                        {SLEEP_SCHEDULES.find(s => s.value === profile.roommatePreferences?.preferredSleepSchedule)?.label}
                      </span>
                    </div>
                  )}
                  {(!profile?.roommatePreferences?.ageRange && !profile?.roommatePreferences?.budgetRange) && (
                    <p className="text-white/60 italic">Set your roommate preferences</p>
                  )}
                </div>
              </div>
            </div>

            {/* Interests & Tags */}
            {((profile?.interests && profile.interests.length > 0) || (profile?.lifestyle?.lifestyleTags && profile.lifestyle.lifestyleTags.length > 0)) && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  Interests & Lifestyle
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests?.slice(0, 8).map((interest, index) => (
                    <Badge key={index} className="bg-white/20 text-white border-white/30 px-3 py-1">
                      {interest}
                    </Badge>
                  ))}
                  {profile.lifestyle?.lifestyleTags?.slice(0, 6).map((tag, index) => (
                    <Badge key={`tag-${index}`} className="bg-gradient-to-r from-yellow-400/20 to-orange-400/20 text-white border-yellow-400/30 px-3 py-1">
                      ✨ {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Completion Progress */}
            {!profile?.isComplete && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Profile Completion</h3>
                  <span className="text-lg font-bold">
                    {Math.round(((profile?.name ? 1 : 0) + 
                                (profile?.age ? 1 : 0) + 
                                (profile?.location ? 1 : 0) + 
                                (profile?.occupation ? 1 : 0) + 
                                (profile?.bio ? 1 : 0) + 
                                (profile?.lifestyle?.cleanliness ? 1 : 0) + 
                                (profile?.lifestyle?.socialLevel ? 1 : 0) + 
                                (profile?.roommatePreferences?.ageRange ? 1 : 0)) / 8 * 100)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 mb-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.round(((profile?.name ? 1 : 0) + 
                                          (profile?.age ? 1 : 0) + 
                                          (profile?.location ? 1 : 0) + 
                                          (profile?.occupation ? 1 : 0) + 
                                          (profile?.bio ? 1 : 0) + 
                                          (profile?.lifestyle?.cleanliness ? 1 : 0) + 
                                          (profile?.lifestyle?.socialLevel ? 1 : 0) + 
                                          (profile?.roommatePreferences?.ageRange ? 1 : 0)) / 8 * 100)}%` 
                    }}
                  ></div>
                </div>
                <p className="text-white/80">Complete your profile to unlock AI-powered matching</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Voice Setup Section */}
        <div className="mb-8">
          <RoomoQuickSetup className="w-full" />
        </div>

        {/* Section Navigation */}
        <div className="flex space-x-1 mb-8 bg-white/60 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
          {[
            { key: 'basic', label: 'Basic Info', icon: User },
            { key: 'lifestyle', label: 'Lifestyle', icon: Calendar },
            { key: 'roommate', label: 'Roommate Prefs', icon: Briefcase },
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setActiveSection(section.key as any)}
                className={`flex-1 py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 font-semibold ${
                  activeSection === section.key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-white/80'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="hidden sm:inline">{section.label}</span>
              </button>
            );
          })}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            {activeSection === 'basic' && (
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                  {/* Photo Section */}
                  <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-2xl border border-purple-100/50">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={profile?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xl">
                        <Camera className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Profile Photo</h3>
                      <p className="text-gray-600 mb-4">Add a great photo to help matches recognize you</p>
                      {isEditing && (
                        <>
                          <Button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={photoUploading}
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg"
                          >
                            {photoUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-2" />
                                Change Photo
                              </>
                            )}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!isEditing}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="occupation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occupation</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="education"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Education</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="e.g., $800-1200/month" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} type="tel" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ''} placeholder="Name and phone" disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ''} placeholder="City, State" disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''}
                            placeholder="Tell us about yourself..." 
                            disabled={!isEditing}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Interests */}
                  <div className="bg-gradient-to-r from-orange-50/50 to-pink-50/50 rounded-2xl p-6 border border-orange-100/50">
                    <Label className="text-lg font-semibold text-gray-800 mb-4 block">Interests & Hobbies</Label>
                    <p className="text-gray-600 mb-4">Select your interests to help find compatible roommates</p>
                    <div className="flex flex-wrap gap-3">
                      {INTERESTS.map((interest) => {
                        const isSelected = form.getValues('interests')?.includes(interest);
                        return (
                          <Badge
                            key={interest}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg border-0 hover:shadow-xl' 
                                : 'border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50'
                            } ${isEditing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                            onClick={() => isEditing && handleInterestToggle(interest)}
                          >
                            {interest}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lifestyle Preferences */}
            {activeSection === 'lifestyle' && (
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span>Lifestyle Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                  {/* Cleanliness and Social Levels */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="lifestyle.cleanliness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cleanliness Preference</FormLabel>
                          <Input
                            {...field}
                            placeholder="Describe your cleanliness preference"
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.socialLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Preference</FormLabel>
                          <Input
                            {...field}
                            placeholder="Describe your social preference"
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.musicLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Music Level (1-5)</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))} 
                            value={field.value?.toString() || ''} 
                            disabled={!isEditing}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MUSIC_LEVELS.map((level) => (
                                <SelectItem key={level.value} value={level.value.toString()}>
                                  {level.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.workSchedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work Schedule</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select schedule" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {WORK_SCHEDULES.map((schedule) => (
                                <SelectItem key={schedule} value={schedule}>{schedule}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.roomType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Room Type</FormLabel>
                          <Input
                            {...field}
                            placeholder="Describe your preferred room type"
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.floorType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Floor Preference</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select floor type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FLOOR_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyle.guestPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Guest Policy</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select guest policy" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GUEST_POLICIES.map((policy) => (
                                <SelectItem key={policy.value} value={policy.value}>{policy.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sleep Schedule */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Sleep Schedule</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="lifestyle.sleepTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sleep Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                disabled={!isEditing}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lifestyle.wakeTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Wake Time</FormLabel>
                            <FormControl>
                              <Input 
                                type="time" 
                                {...field} 
                                disabled={!isEditing}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Habits and Preferences */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Personal Habits</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="lifestyle.pets"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>I have pets</FormLabel>
                            </FormItem>
                          )}
                        />

                        {form.watch('lifestyle.pets') && (
                          <FormField
                            control={form.control}
                            name="lifestyle.petType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pet Type</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Cat, Dog, Bird" disabled={!isEditing} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={form.control}
                          name="lifestyle.smoking"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>I smoke</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lifestyle.drinking"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>I drink alcohol</FormLabel>
                            </FormItem>
                          )}
                        />

                        {form.watch('lifestyle.drinking') && (
                          <FormField
                            control={form.control}
                            name="lifestyle.drinkingFrequency"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Drinking Frequency</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select frequency" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {DRINKING_FREQUENCIES.map((freq) => (
                                      <SelectItem key={freq} value={freq}>{freq}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="lifestyle.cooking"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>I enjoy cooking</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Tags */}
                  <div className="bg-gradient-to-r from-teal-50/50 to-emerald-50/50 rounded-2xl p-6 border border-teal-100/50">
                    <Label className="text-lg font-semibold text-gray-800 mb-4 block">Lifestyle Tags</Label>
                    <p className="text-gray-600 mb-4">Choose tags that best describe your lifestyle</p>
                    <div className="flex flex-wrap gap-3">
                      {LIFESTYLE_TAGS.map((tag) => {
                        const isSelected = form.getValues('lifestyle')?.lifestyleTags?.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={isSelected ? 'default' : 'outline'}
                            className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                              isSelected 
                                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg border-0 hover:shadow-xl' 
                                : 'border-2 border-teal-200 hover:border-teal-400 hover:bg-teal-50'
                            } ${isEditing ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                            onClick={() => isEditing && handleLifestyleTagToggle(tag)}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Roommate Preferences */}
            {activeSection === 'roommate' && (
              <Card className="border-0 bg-white/60 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-t-xl">
                  <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-800">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-white" />
                    </div>
                    <span>Roommate Preferences</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 p-8">
                  {/* Preferred Traits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="roommatePreferences.preferredCleanliness"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Cleanliness (describe in your own words)</FormLabel>
                          <Input 
                            {...field}
                            placeholder="e.g. Very clean, relaxed, etc."
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roommatePreferences.preferredSocialLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Social Level (describe in your own words)</FormLabel>
                          <Input 
                            {...field}
                            placeholder="e.g. Very social, quiet, etc."
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roommatePreferences.preferredSleepSchedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Sleep Schedule (describe in your own words)</FormLabel>
                          <Input 
                            {...field}
                            placeholder="e.g. Early bird, night owl, flexible, etc."
                            disabled={!isEditing}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roommatePreferences.preferredGuestPolicy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Guest Policy</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select preference" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GUEST_POLICIES.map((policy) => (
                                <SelectItem key={policy.value} value={policy.value}>
                                  {policy.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="roommatePreferences.interestMatching"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Matching Importance</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} disabled={!isEditing}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select importance" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="very_important">Very Important</SelectItem>
                              <SelectItem value="somewhat_important">Somewhat Important</SelectItem>
                              <SelectItem value="not_important">Not Important</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tolerance Checkboxes */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Tolerance & Preferences</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="roommatePreferences.okWithPets"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>OK with roommate having pets</FormLabel>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="roommatePreferences.okWithSmoking"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                  disabled={!isEditing}
                                />
                              </FormControl>
                              <FormLabel>OK with roommate smoking</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Age and Budget Ranges */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Matching Preferences</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label>Age Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="roommatePreferences.ageRange.0"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Min Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      const currentRange = form.getValues('roommatePreferences.ageRange') || [18, 35];
                                      const newRange: [number, number] = [parseInt(e.target.value) || 18, currentRange[1]];
                                      form.setValue('roommatePreferences.ageRange', newRange);
                                    }}
                                    value={form.getValues('roommatePreferences.ageRange')?.[0] || 18}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="roommatePreferences.ageRange.1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Age</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      const currentRange = form.getValues('roommatePreferences.ageRange') || [18, 35];
                                      const newRange: [number, number] = [currentRange[0], parseInt(e.target.value) || 35];
                                      form.setValue('roommatePreferences.ageRange', newRange);
                                    }}
                                    value={form.getValues('roommatePreferences.ageRange')?.[1] || 35}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label>Budget Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name="roommatePreferences.budgetRange.0"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Min Budget</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      const currentRange = form.getValues('roommatePreferences.budgetRange') || [500, 2000];
                                      const newRange: [number, number] = [parseInt(e.target.value) || 500, currentRange[1]];
                                      form.setValue('roommatePreferences.budgetRange', newRange);
                                    }}
                                    value={form.getValues('roommatePreferences.budgetRange')?.[0] || 500}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="roommatePreferences.budgetRange.1"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Budget</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    disabled={!isEditing}
                                    onChange={(e) => {
                                      const currentRange = form.getValues('roommatePreferences.budgetRange') || [500, 2000];
                                      const newRange: [number, number] = [currentRange[0], parseInt(e.target.value) || 2000];
                                      form.setValue('roommatePreferences.budgetRange', newRange);
                                    }}
                                    value={form.getValues('roommatePreferences.budgetRange')?.[1] || 2000}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="roommatePreferences.locationRadius"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location Radius (miles)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              disabled={!isEditing}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                              value={field.value || 10}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-center mt-12">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600 text-white px-12 py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 border-0"
                >
                  <Save className="h-5 w-5 mr-3" />
                  <span>
                    {updateProfileMutation.isPending ? 'Saving Changes...' : 'Save Profile ✨'}
                  </span>
                </Button>
              </div>
            )}
            
            {/* Floating Save Button for Mobile */}
            {isEditing && (
              <div className="fixed bottom-6 right-6 md:hidden z-50">
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-16 h-16 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border-0"
                >
                  <Save className="h-6 w-6" />
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}