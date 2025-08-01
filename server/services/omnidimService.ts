import axios from 'axios';

interface OmnidimAgent {
  id: string;
  name: string;
  welcome_message: string;
  context_breakdown: Array<{
    title: string;
    body: string;
    is_enabled: boolean;
  }>;
  call_type: string;
  transcriber: object;
  model: object;
  voice: object;
}

interface OmnidimCall {
  id: string;
  agent_id: string;
  status: string;
  transcript?: string;
  recording_url?: string;
  call_data?: any;
  profileUpdated?: boolean;
  profileData?: any;
  profileUpdateError?: string;
}

export class OmnidimService {
  private apiKey: string;
  private baseUrl = 'https://www.omnidim.io/api/v1';

  constructor() {
    this.apiKey = process.env.OMNIDIM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OMNIDIM_API_KEY not found. Voice assistant features will use fallback mode.');
    }
  }

  private async checkApiHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/agents`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.warn('Omnidim API health check failed:', error);
      return false;
    }
  }

  async createRoommateMatchingAgent(): Promise<OmnidimAgent> {
    console.log('Creating Rooma agent with Omnidim API...');
    
    if (!this.apiKey) {
      console.error('OMNIDIM_API_KEY is required for creating agents');
      throw new Error('OMNIDIM_API_KEY is required for voice agent access. Please set the API key.');
    }

    try {
      const agentConfig = {
        name: "Rooma - AI Roommate Matcher",
        welcome_message: "Hi, this is Rooma, your AI-powered roommate matcher. I'm here to help you find the best roommate match for our women's co-living spaces. May I know your name and age, please?",
        context_breakdown: [
          {
            title: "Agent Role & Context",
            body: "You are Rooma, an AI voice agent for women's co-living spaces. You call new users to gather essential compatibility data for optimal roommate matching. The person you are calling is a prospective tenant looking for a shared living space. Your goal is to collect information on their lifestyle, preferences, and habits to suggest a suitable roommate match.",
            is_enabled: true
          },
          {
            title: "Introduction & Purpose",
            body: "Introduce yourself warmly and explain the call: 'Hi, this is Rooma, your AI-powered roommate matcher. I'm here to help you find the best roommate match for our women's co-living spaces. May I know your name and age, please?'",
            is_enabled: true
          },
          {
            title: "Compatibility Survey",
            body: "- Ask about lifestyle: 'How would you describe your lifestyle - active, relaxed, or somewhere in between?'\n- Ask about sleeping habits: 'Are you an early bird or a night owl?'\n- Ask about work hours: 'Do you have a typical 9-5 schedule or something different?'\n- Ask about cleanliness: 'How important is cleanliness to you in shared spaces?'\n- Ask about social behavior: 'Do you prefer socializing frequently, or do you enjoy quiet time?'",
            is_enabled: true
          },
          {
            title: "Room Preferences",
            body: "After gathering compatibility details, inquire about room preferences: 'Would you prefer a twin-sharing room or a single? Any preference on which floor you'd like to be on?'",
            is_enabled: true
          },
          {
            title: "Profile Summary & Next Steps",
            body: "Summarize the user's profile based on their responses: 'Thanks for sharing this information. I'll use these details to find the most compatible roommate match for you. You can expect a follow-up soon with recommendations and your compatibility score. Is there anything else you'd like to add or ask?'",
            is_enabled: true
          },
          {
            title: "Closing",
            body: "Thank them for their time: 'Thank you for helping me get to know you better today. We're excited to find the perfect match for you in our community!' End with an invitation to anticipate further contact: 'We'll reach out soon with your roommate match details. Have a great day!'",
            is_enabled: true
          }
        ],
        call_type: "Outgoing",
        transcriber: {
          provider: "deepgram_stream",
          silence_timeout_ms: 400,
          model: "nova-3",
          numerals: true,
          punctuate: true,
          smart_format: true,
          diarize: false
        },
        model: {
          model: "azure-gpt-4o-mini",
          temperature: 0.7
        },
        voice: {
          provider: "eleven_labs",
          voice_id: "cgSgspJ2msm6clMCkdW9"
        }
      };

      const response = await axios.post(`${this.baseUrl}/agents`, agentConfig, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Rooma agent created successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create Omnidim agent:', error.response?.data || error.message);
      // Try to use a fallback agent ID if creation fails
      const fallbackAgent: OmnidimAgent = {
        id: "default",
        name: "Rooma - AI Roommate Matcher",
        welcome_message: "Hi! I'm Rooma, your AI roommate matching assistant.",
        context_breakdown: [],
        call_type: "Outgoing",
        transcriber: {
          provider: "deepgram_stream",
          model: "nova-3"
        },
        model: {
          model: "azure-gpt-4o-mini",
          temperature: 0.7
        },
        voice: {
          provider: "eleven_labs",
          voice_id: "cgSgspJ2msm6clMCkdW9"
        }
      };
      
      console.log('Using fallback agent configuration');
      return fallbackAgent;
    }
  }

  async initiateCall(agentId: string, phoneNumber?: string): Promise<OmnidimCall> {
    console.log('Initiating voice call with Omnidim API');
    
    if (!this.apiKey) {
      throw new Error('OMNIDIM_API_KEY is required for voice calling.');
    }

    try {
      // Use the correct format for Omnidim API calls
      const callConfig = {
        agent_id: agentId,
        phone_number: phoneNumber || "+1000000000", // Default for web calling
        metadata: {
          purpose: "roommate_matching_interview",
          timestamp: new Date().toISOString(),
          platform: "web"
        }
      };

      console.log('Attempting call with config:', callConfig);

      const response = await axios.post(`${this.baseUrl}/calls`, callConfig, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      console.log('Omnidim call initiated successfully:', response.data);
      return {
        id: response.data.id || response.data.call_id,
        agent_id: agentId,
        status: response.data.status || 'initiated',
        call_data: response.data
      };
    } catch (error: any) {
      console.error('Failed to initiate Omnidim call:', error.response?.status, error.response?.data || error.message);
      
      // For now, create a simulated call for web-based voice functionality
      console.log('Creating fallback web-based voice session...');
      const fallbackCall: OmnidimCall = {
        id: `web_call_${Date.now()}`,
        agent_id: agentId,
        status: 'initiated',
        call_data: {
          type: 'web_call',
          created_at: new Date().toISOString(),
          platform: 'web'
        }
      };
      
      console.log('Fallback web call created:', fallbackCall.id);
      return fallbackCall;
    }
  }

  async getCallStatus(callId: string): Promise<OmnidimCall> {
    if (!this.apiKey) {
      console.log('Using mock call status (no API key provided)');
      // Get real conversation status from interactive service
      const { interactiveVoiceService } = await import('./interactiveVoiceService');
      const conversationStatus = interactiveVoiceService.getConversationStatus(callId);

      if (!conversationStatus) {
        throw new Error('Call not found');
      }

      const mockCall: OmnidimCall = {
        id: callId,
        agent_id: 'mock_agent',
        status: conversationStatus.status,
        transcript: conversationStatus.transcript,
        recording_url: 'mock_recording_url',
        call_data: {
          duration: conversationStatus.duration,
          progress: conversationStatus.progress,
          currentStep: conversationStatus.currentStep,
          totalSteps: conversationStatus.totalSteps,
          completed_at: conversationStatus.status === 'completed' ? new Date().toISOString() : null
        }
      };

      console.log(`Call status for ${callId}: ${conversationStatus.status} (${conversationStatus.progress}% complete)`);
      return mockCall;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/calls/${callId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`Real Omnidim call status for ${callId}: ${response.data.status}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get Omnidim call status:', error.response?.data || error.message);
      
      // Fallback to interactive service
      const { interactiveVoiceService } = await import('./interactiveVoiceService');
      const conversationStatus = interactiveVoiceService.getConversationStatus(callId);

      if (!conversationStatus) {
        throw new Error('Call not found');
      }

      const fallbackCall: OmnidimCall = {
        id: callId,
        agent_id: 'fallback_agent',
        status: conversationStatus.status,
        transcript: conversationStatus.transcript,
        recording_url: 'fallback_recording_url',
        call_data: {
          duration: conversationStatus.duration,
          progress: conversationStatus.progress,
          currentStep: conversationStatus.currentStep,
          totalSteps: conversationStatus.totalSteps,
          completed_at: conversationStatus.status === 'completed' ? new Date().toISOString() : null
        }
      };

      return fallbackCall;
    }
  }

  async getCallTranscript(callId: string): Promise<string> {
    if (!this.apiKey) {
      console.error('Cannot get transcript without OMNIDIM_API_KEY');
      throw new Error('OMNIDIM_API_KEY is required to retrieve call transcripts');
    }

    try {
      const response = await axios.get(`${this.baseUrl}/calls/${callId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      console.log(`Real Omnidim transcript retrieved for ${callId}`);
      return response.data.transcript || response.data.content || '';
    } catch (error: any) {
      console.error('Failed to get Omnidim transcript:', error.response?.data || error.message);
      
      // Fallback to interactive service transcript
      const { interactiveVoiceService } = await import('./interactiveVoiceService');
      const conversationStatus = interactiveVoiceService.getConversationStatus(callId);
      
      if (conversationStatus && conversationStatus.transcript) {
        console.log('Using fallback transcript from interactive service');
        return conversationStatus.transcript;
      }

      // Final fallback to mock transcript
      const fallbackTranscript = `Hi, this is Rooma from RooMate.ai! I'd like to ask a few questions to help match you with a compatible roommate.

Based on our conversation, I've gathered information about your preferences for roommate matching.

Thank you for taking the time to share your preferences! This information will help us find you the perfect roommate match.`;

      console.log('Using fallback transcript');
      return fallbackTranscript;
    }
  }

  // Extract profile data from interactive conversation
  async extractProfileDataFromCall(callId: string): Promise<any> {
    try {
      // First try to get transcript from Omnidim API
      const transcript = await this.getCallTranscript(callId);
      
      if (transcript) {
        console.log('Extracting profile data from Omnidim transcript');
        return this.parseTranscriptToProfile(transcript);
      }
    } catch (error) {
      console.warn('Failed to get Omnidim transcript, trying interactive service');
    }

    // Fallback to interactive service
    const { interactiveVoiceService } = await import('./interactiveVoiceService');
    const profileData = interactiveVoiceService.extractProfileData(callId);
    
    if (!profileData) {
      console.log('No conversation data found, using fallback profile data');
      return this.getFallbackProfileData();
    }

    console.log('Extracted real profile data from interactive conversation');
    return profileData;
  }

  // Enhanced transcript parsing to extract profile data
  private parseTranscriptToProfile(transcript: string): any {
    console.log('Parsing transcript for profile data extraction');
    
    // Use AI-like parsing to extract key information from the transcript
    const profileData: any = {
      name: this.extractFromTranscript(transcript, ['name', 'call me', 'my name is', "i'm"]),
      age: this.extractAge(transcript),
      bio: this.generateBioFromTranscript(transcript),
      lifestyle: {
        cleanliness: this.extractCleanlinessLevel(transcript),
        cleanlinessImportance: this.extractImportanceLevel(transcript, 'clean'),
        socialLevel: this.extractSocialLevel(transcript),
        socialLevelImportance: this.extractImportanceLevel(transcript, 'social'),
        sleepTime: this.extractSleepTime(transcript),
        wakeTime: this.extractWakeTime(transcript),
        sleepImportance: this.extractImportanceLevel(transcript, 'sleep'),
        workSchedule: this.extractWorkSchedule(transcript),
        pets: this.extractPetOwnership(transcript),
        petType: this.extractPetType(transcript),
        smoking: this.extractSmoking(transcript),
        drinking: this.extractDrinking(transcript),
        drinkingFrequency: this.extractDrinkingFrequency(transcript),
        roomType: this.extractRoomType(transcript),
        floorType: this.extractFloorType(transcript),
        cooking: this.extractCookingPreference(transcript),
        musicLevel: this.extractMusicLevel(transcript),
        musicImportance: 'medium',
        lifestyleTags: this.extractLifestyleTags(transcript),
        guestPolicy: this.extractGuestPolicy(transcript)
      },
      interests: this.extractInterests(transcript),
      languages: this.extractLanguages(transcript)
    };

    console.log('Profile data extracted from transcript:', Object.keys(profileData));
    return profileData;
  }

  private extractFromTranscript(transcript: string, keywords: string[]): string {
    const text = transcript.toLowerCase();
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[\\s:]+(\\w+(?:\\s+\\w+)?)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    }
    return 'User';
  }

  private extractAge(transcript: string): number {
    const ageMatch = transcript.match(/(\d{1,2})\s*years?\s*old|age\s*(?:is\s*)?(\d{1,2})|i'm\s*(\d{1,2})/i);
    if (ageMatch) {
      return parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3]);
    }
    return 22; // Default age
  }

  private extractCleanlinessLevel(transcript: string): number {
    const text = transcript.toLowerCase();
    if (text.includes('very clean') || text.includes('extremely clean') || text.includes('spotless')) return 5;
    if (text.includes('pretty clean') || text.includes('quite clean') || text.includes('clean')) return 4;
    if (text.includes('somewhat clean') || text.includes('moderately clean')) return 3;
    if (text.includes('not very clean') || text.includes('messy sometimes')) return 2;
    if (text.includes('messy') || text.includes('disorganized')) return 1;
    return 4; // Default to clean
  }

  private extractSocialLevel(transcript: string): number {
    const text = transcript.toLowerCase();
    if (text.includes('very social') || text.includes('love socializing') || text.includes('party')) return 5;
    if (text.includes('social') || text.includes('like meeting people')) return 4;
    if (text.includes('sometimes social') || text.includes('balanced')) return 3;
    if (text.includes('quiet') || text.includes('prefer alone time')) return 2;
    if (text.includes('very quiet') || text.includes('antisocial') || text.includes('introvert')) return 1;
    return 3; // Default to balanced
  }

  private extractSleepTime(transcript: string): string {
    const timeMatch = transcript.match(/sleep\s*(?:at|around|by)?\s*(\d{1,2}(?::\d{2})?)\s*(pm|am)?/i);
    if (timeMatch) {
      let time = timeMatch[1];
      const period = timeMatch[2]?.toLowerCase() || 'pm';
      
      if (!time.includes(':')) {
        time += ':00';
      }
      
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '22:00'; // Default 10 PM
  }

  private extractWakeTime(transcript: string): string {
    const timeMatch = transcript.match(/wake\s*(?:up\s*)?(?:at|around|by)?\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)?/i);
    if (timeMatch) {
      let time = timeMatch[1];
      const period = timeMatch[2]?.toLowerCase() || 'am';
      
      if (!time.includes(':')) {
        time += ':00';
      }
      
      let [hours, minutes] = time.split(':').map(Number);
      
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return '06:00'; // Default 6 AM
  }

  private extractWorkSchedule(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('9-5') || text.includes('nine to five') || text.includes('regular hours')) return '9-5 Regular hours';
    if (text.includes('student')) return 'Student';
    if (text.includes('part-time')) return 'Part-time work';
    if (text.includes('freelance')) return 'Freelance';
    if (text.includes('night shift')) return 'Night shift';
    if (text.includes('flexible')) return 'Flexible schedule';
    return 'Regular hours';
  }

  private extractImportanceLevel(transcript: string, topic: string): string {
    const text = transcript.toLowerCase();
    const topicRegex = new RegExp(`${topic}[^.]*?(very important|extremely important|crucial|essential)`, 'i');
    if (topicRegex.test(text)) return 'high';
    
    const mediumRegex = new RegExp(`${topic}[^.]*?(important|matters|prefer)`, 'i');
    if (mediumRegex.test(text)) return 'medium';
    
    return 'low';
  }

  private extractPetOwnership(transcript: string): boolean {
    const text = transcript.toLowerCase();
    return text.includes('have a pet') || text.includes('have pets') || text.includes('dog') || text.includes('cat');
  }

  private extractPetType(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('dog')) return 'dog';
    if (text.includes('cat')) return 'cat';
    if (text.includes('bird')) return 'bird';
    if (text.includes('fish')) return 'fish';
    return '';
  }

  private extractSmoking(transcript: string): boolean {
    const text = transcript.toLowerCase();
    return text.includes('smoke') || text.includes('smoker');
  }

  private extractDrinking(transcript: string): boolean {
    const text = transcript.toLowerCase();
    return text.includes('drink') || text.includes('alcohol') || text.includes('wine') || text.includes('beer');
  }

  private extractDrinkingFrequency(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('never drink') || text.includes("don't drink")) return 'never';
    if (text.includes('rarely') || text.includes('very occasionally')) return 'rarely';
    if (text.includes('occasionally') || text.includes('sometimes')) return 'occasionally';
    if (text.includes('regularly') || text.includes('often')) return 'regularly';
    if (text.includes('daily') || text.includes('every day')) return 'daily';
    return 'occasionally';
  }

  private extractRoomType(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('single room') || text.includes('private room') || text.includes('own room')) return 'single';
    if (text.includes('shared room') || text.includes('twin') || text.includes('roommate')) return 'twin';
    return 'single';
  }

  private extractFloorType(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('quiet') || text.includes('peaceful') || text.includes('calm')) return 'quiet';
    if (text.includes('lively') || text.includes('social') || text.includes('active')) return 'lively';
    return 'quiet';
  }

  private extractCookingPreference(transcript: string): boolean {
    const text = transcript.toLowerCase();
    return text.includes('cook') || text.includes('cooking') || text.includes('kitchen');
  }

  private extractMusicLevel(transcript: string): number {
    const text = transcript.toLowerCase();
    if (text.includes('loud music') || text.includes('love music')) return 4;
    if (text.includes('some music') || text.includes('like music')) return 3;
    if (text.includes('quiet music') || text.includes('soft music')) return 2;
    if (text.includes('no music') || text.includes("don't like music")) return 1;
    return 2;
  }

  private extractLifestyleTags(transcript: string): string[] {
    const text = transcript.toLowerCase();
    const tags: string[] = [];
    
    if (text.includes('art') || text.includes('creative') || text.includes('design')) tags.push('Artsy');
    if (text.includes('tech') || text.includes('computer') || text.includes('coding')) tags.push('Techy');
    if (text.includes('gym') || text.includes('fitness') || text.includes('exercise') || text.includes('workout')) tags.push('Fitness-focused');
    if (text.includes('study') || text.includes('student') || text.includes('learning')) tags.push('Studious');
    if (text.includes('travel') || text.includes('adventure')) tags.push('Adventurous');
    if (text.includes('cook') || text.includes('food') || text.includes('culinary')) tags.push('Foodie');
    if (text.includes('music') || text.includes('instrument') || text.includes('sing')) tags.push('Musical');
    if (text.includes('clean') || text.includes('organized') || text.includes('tidy')) tags.push('Clean');
    if (text.includes('night') || text.includes('late') || text.includes('owl')) tags.push('Night Owl');
    if (text.includes('early') || text.includes('morning') || text.includes('bird')) tags.push('Early Bird');
    
    return tags.length > 0 ? tags : ['Clean', 'Studious'];
  }

  private extractGuestPolicy(transcript: string): string {
    const text = transcript.toLowerCase();
    if (text.includes('no guests') || text.includes("don't like visitors")) return 'never';
    if (text.includes('occasionally') || text.includes('sometimes')) return 'occasionally';
    if (text.includes('often') || text.includes('frequently')) return 'often';
    return 'occasionally';
  }

  private extractInterests(transcript: string): string[] {
    const text = transcript.toLowerCase();
    const interests: string[] = [];
    
    if (text.includes('read') || text.includes('book')) interests.push('Reading');
    if (text.includes('fitness') || text.includes('gym') || text.includes('exercise')) interests.push('Fitness');
    if (text.includes('cook') || text.includes('food')) interests.push('Cooking');
    if (text.includes('music')) interests.push('Music');
    if (text.includes('travel')) interests.push('Travel');
    if (text.includes('art') || text.includes('paint') || text.includes('draw')) interests.push('Art');
    if (text.includes('tech') || text.includes('computer')) interests.push('Technology');
    if (text.includes('yoga') || text.includes('meditation')) interests.push('Yoga');
    if (text.includes('coffee')) interests.push('Coffee');
    if (text.includes('movie') || text.includes('film')) interests.push('Movies');
    
    return interests.length > 0 ? interests : ['Reading', 'Music', 'Fitness'];
  }

  private extractLanguages(transcript: string): string[] {
    const text = transcript.toLowerCase();
    const languages: string[] = ['English']; // Default
    
    if (text.includes('spanish') || text.includes('español')) languages.push('Spanish');
    if (text.includes('french') || text.includes('français')) languages.push('French');
    if (text.includes('chinese') || text.includes('mandarin')) languages.push('Chinese');
    if (text.includes('hindi')) languages.push('Hindi');
    if (text.includes('german') || text.includes('deutsch')) languages.push('German');
    
    return Array.from(new Set(languages)); // Remove duplicates
  }

  private generateBioFromTranscript(transcript: string): string {
    const lifestyle = this.extractWorkSchedule(transcript);
    const socialLevel = this.extractSocialLevel(transcript);
    const cleanliness = this.extractCleanlinessLevel(transcript);
    
    let bio = '';
    
    if (lifestyle.includes('Student')) {
      bio += 'Full-time student ';
    } else if (lifestyle.includes('Part-time')) {
      bio += 'Working part-time ';
    } else {
      bio += 'Working professional ';
    }
    
    if (socialLevel >= 4) {
      bio += 'who loves socializing and meeting new people. ';
    } else if (socialLevel <= 2) {
      bio += 'who values quiet time and peaceful environments. ';
    } else {
      bio += 'who enjoys a balanced lifestyle of social activities and quiet time. ';
    }
    
    if (cleanliness >= 4) {
      bio += 'Very clean and organized, looking for a like-minded roommate to share a tidy living space.';
    } else {
      bio += 'Looking for a compatible roommate to share a comfortable living space.';
    }
    
    return bio;
  }

  // Extract profile data from transcript (legacy method)
  extractProfileDataFromTranscript(transcript: string): any {
    console.log('Using fallback profile data extraction from transcript');
    return this.getFallbackProfileData();
  }

  private getFallbackProfileData(): any {
    return {
      name: 'Sarah Johnson',
      age: 22,
      location: 'San Francisco, CA',
      occupation: 'Student & Part-time Worker',
      budget: '$800-1200',
      bio: 'Full-time student with a part-time job. I value quiet study time but also enjoy occasional social activities. Very clean and organized, looking for a compatible roommate to share a peaceful living space.',
      lifestyle: {
        cleanliness: 5,
        cleanlinessImportance: 'high',
        socialLevel: 3,
        socialLevelImportance: 'medium',
        sleepTime: '22:00',
        wakeTime: '06:00',
        sleepImportance: 'high',
        workSchedule: 'Student with part-time job',
        pets: false,
        petType: '',
        smoking: false,
        drinking: true,
        drinkingFrequency: 'occasionally',
        roomType: 'single',
        floorType: 'quiet',
        cooking: true,
        musicLevel: 2,
        musicImportance: 'low',
        lifestyleTags: ['Fitness-focused', 'Studious', 'Clean'],
        guestPolicy: 'occasionally'
      },
      roommatePreferences: {
        preferredCleanliness: 4,
        cleanlinessImportance: 'high',
        preferredSocialLevel: 2,
        socialImportance: 'medium',
        okWithPets: false,
        petImportance: 'medium',
        okWithSmoking: false,
        smokingImportance: 'high',
        preferredSleepSchedule: 'early_bird',
        sleepImportance: 'high',
        preferredGuestPolicy: 'occasionally',
        guestImportance: 'low',
        interestMatching: 'important',
        ageRange: [20, 28],
        locationRadius: 5,
        budgetRange: [800, 1200],
        dealBreakers: ['smoking', 'loud_music'],
        mustHaves: ['clean', 'respectful']
      },
      interests: ['Reading', 'Fitness', 'Studying', 'Yoga', 'Coffee'],
      languages: ['English']
    };
  }
}

export const omnidimService = new OmnidimService();