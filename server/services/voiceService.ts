export class VoiceService {
  private omnidimApiKey: string;

  constructor() {
    this.omnidimApiKey = process.env.OMNIDIM_API_KEY || process.env.VITE_OMNIDIM_API_KEY || "";
    if (!this.omnidimApiKey) {
      console.warn("Omnidim API key not found. Voice features may not work.");
    }
  }

  async processVoiceInput(audioData: string): Promise<string> {
    try {
      if (!this.omnidimApiKey) {
        // Return empty string when no API key - don't provide fake data
        console.log("No Omnidim API key available - voice processing unavailable");
        return "";
      }

      // Call Omnidim API for voice-to-text conversion
      const response = await fetch('https://api.omnidim.io/v1/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.omnidimApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioData,
          language: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`Omnidim API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.transcription || "";
    } catch (error) {
      console.error("Voice processing error:", error);
      // Return empty string on error - don't provide fake data
      return "";
    }
  }

  async extractProfileData(transcription: string): Promise<any> {
    // Enhanced AI-like extraction based on common patterns
    const profileData: any = {
      lifestyle: {},
      preferences: {},
      tags: [],
      languages: [],
      interests: [],
      roomoResponses: [],
    };

    // Check for roomo-related content and extract special insights
    if (transcription.toLowerCase().includes('roomo')) {
      profileData.roomoResponses.push({
        content: transcription,
        timestamp: new Date().toISOString(),
        source: 'voice_input'
      });
      
      // Add roomo-specific interests and preferences
      if (transcription.toLowerCase().includes('roomo community')) {
        profileData.interests.push('Roomo Community');
      }
      if (transcription.toLowerCase().includes('roomo lifestyle')) {
        profileData.interests.push('Roomo Lifestyle');
        profileData.tags.push('roomo-compatible');
      }
    }

    const text = transcription.toLowerCase();

    // Extract name with improved patterns
    const namePatterns = [
      /(?:my name is|i'?m|call me|i go by)\s+([a-z]+(?:\s+[a-z]+)?)/i,
      /(?:hi|hello),?\s*i'?m\s+([a-z]+(?:\s+[a-z]+)?)/i,
    ];
    for (const pattern of namePatterns) {
      const match = transcription.match(pattern); // Use original case for names
      if (match) {
        const name = match[1].trim();
        if (name.length > 1 && name.length < 50) {
          profileData.name = name;
          break;
        }
      }
    }

    // Extract age with improved patterns
    const agePatterns = [
      /(\d+)\s*(years?\s*old|year-old)/,
      /i'?m\s+(\d+)/,
      /age\s+(\d+)/,
    ];
    for (const pattern of agePatterns) {
      const match = text.match(pattern);
      if (match) {
        const age = parseInt(match[1]);
        if (age >= 18 && age <= 65) {
          profileData.age = age;
          break;
        }
      }
    }

    // Extract location with improved patterns
    const locationPatterns = [
      /(?:in|from|live\s+in|located\s+in|based\s+in)\s+([a-z\s,]+(?:area|city|downtown|neighborhood)?)/i,
      /(san francisco|new york|los angeles|chicago|boston|seattle|austin|denver|portland|miami|atlanta)/i,
    ];
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) {
        profileData.location = match[1].trim();
        break;
      }
    }

    // Extract occupation with comprehensive patterns
    const occupationPatterns = [
      /(?:i'?m\s+a|work\s+as\s+a|i\s+work\s+as|profession\s+is)\s+([^,\.]+?)\s+(?:looking|and|who|,|\.)/,
      /(software engineer|web developer|graphic designer|product manager|data scientist|teacher|nurse|doctor|lawyer|student|consultant|marketing|sales|accountant|chef|artist|writer|photographer|therapist|dentist|veterinarian)/i,
      /work\s+(?:from\s+home\s+)?as\s+(?:a\s+)?([^,\.]+)/,
    ];
    for (const pattern of occupationPatterns) {
      const match = text.match(pattern);
      if (match) {
        profileData.occupation = match[1].trim();
        break;
      }
    }

    // Extract lifestyle preferences
    if (text.includes('clean') || text.includes('tidy')) {
      profileData.lifestyle.cleanliness = 4;
      profileData.tags.push('Clean');
    }
    if (text.includes('quiet') || text.includes('peaceful')) {
      profileData.lifestyle.socialLevel = 2;
      profileData.tags.push('Quiet');
    }
    if (text.includes('social') || text.includes('outgoing')) {
      profileData.lifestyle.socialLevel = 4;
      profileData.tags.push('Social');
    }
    if (text.includes('night owl') || text.includes('late')) {
      profileData.lifestyle.sleepSchedule = 'night';
      profileData.tags.push('Night Owl');
    }
    if (text.includes('early bird') || text.includes('morning')) {
      profileData.lifestyle.sleepSchedule = 'morning';
      profileData.tags.push('Early Bird');
    }
    if (text.includes('cook') || text.includes('cooking')) {
      profileData.lifestyle.cooking = true;
      profileData.tags.push('Cooking');
    }
    if (text.includes('pet') || text.includes('dog') || text.includes('cat')) {
      profileData.lifestyle.pets = true;
      profileData.tags.push('Pet Friendly');
    }
    if (text.includes('smoke') || text.includes('smoking')) {
      profileData.lifestyle.smoking = true;
    }
    if (text.includes('drink') || text.includes('alcohol')) {
      profileData.lifestyle.drinking = true;
    }

    // Extract budget with improved patterns
    const budgetPatterns = [
      /budget\s+(?:is\s+)?(?:around\s+)?\$?(\d+)[-–]?\$?(\d+)?/,
      /\$(\d+)[-–]\$?(\d+)?\s*(?:per\s+month|\/month|monthly)/,
      /between\s+\$?(\d+)\s+(?:and|to)\s+\$?(\d+)/,
      /\$(\d+)\s*[-–]\s*\$?(\d+)/,
    ];
    for (const pattern of budgetPatterns) {
      const match = text.match(pattern);
      if (match) {
        const min = parseInt(match[1]);
        const max = match[2] ? parseInt(match[2]) : min + 500;
        if (min >= 200 && max <= 10000) {
          profileData.budget = `$${min}-${max}/month`;
          profileData.preferences.budgetRange = [min, max];
          break;
        }
      }
    }

    // Extract deal breakers with improved patterns
    const dealBreakers = [];
    if (text.includes("don't smoke") || text.includes("no smoking") || text.includes("non-smoker")) {
      dealBreakers.push("smoking");
    }
    if (text.includes("no pets") || text.includes("don't want pets") || text.includes("no animals")) {
      dealBreakers.push("pets");
    }
    if (text.includes("no parties") || text.includes("quiet") || text.includes("no loud music")) {
      dealBreakers.push("parties");
    }
    if (text.includes("no overnight guests") || text.includes("no guests")) {
      dealBreakers.push("guests");
    }
    profileData.preferences.dealBreakers = dealBreakers;

    // Extract work schedule
    if (text.includes('work from home') || text.includes('remote work') || text.includes('wfh')) {
      profileData.lifestyle.workSchedule = 'home';
      profileData.tags.push('Work from Home');
    } else if (text.includes('office') || text.includes('commute')) {
      profileData.lifestyle.workSchedule = 'office';
    }

    // Extract sleep preferences
    if (text.includes('bed before') || text.includes('sleep before')) {
      const timeMatch = text.match(/(?:bed|sleep)\s+before\s+(\d+)/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        if (hour <= 10) {
          profileData.lifestyle.sleepSchedule = 'early';
        } else if (hour <= 12) {
          profileData.lifestyle.sleepSchedule = 'normal';
        }
      }
    }

    // Extract languages with improved patterns
    const languagePatterns = [
      /speak\s+([a-z]+(?:\s+and\s+[a-z]+)*)/i,
      /languages?\s*[:\-]?\s*([a-z\s,and]+)/i,
      /(english|spanish|french|german|italian|portuguese|mandarin|cantonese|japanese|korean|arabic|hindi|russian|dutch|swedish|norwegian)/gi,
    ];
    const languages = new Set<string>();
    for (const pattern of languagePatterns) {
      const match = text.match(pattern);
      if (match) {
        const langText = match[1] || match[0];
        const langs = langText.split(/(?:\s+and\s+|,\s*)/);
        langs.forEach(lang => {
          const cleanLang = lang.trim().toLowerCase();
          if (cleanLang.length > 2 && cleanLang.length < 20) {
            languages.add(cleanLang.charAt(0).toUpperCase() + cleanLang.slice(1));
          }
        });
      }
    }
    profileData.languages = Array.from(languages);

    // Extract interests and hobbies with improved patterns
    const interestPatterns = [
      /(?:i love|i enjoy|i like|hobby|hobbies|interests?)\s+([^.]+)/gi,
      /(reading|cooking|hiking|yoga|music|art|photography|travel|sports|fitness|movies|gaming|dancing|writing|painting)/gi,
    ];
    const interests = new Set<string>();
    for (const pattern of interestPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const interestText = match[1] || match[0];
        const interestList = interestText.split(/(?:\s+and\s+|,\s*)/);
        interestList.forEach((interest: string) => {
          const cleanInterest = interest.trim().toLowerCase();
          if (cleanInterest.length > 2 && cleanInterest.length < 30) {
            interests.add(cleanInterest.charAt(0).toUpperCase() + cleanInterest.slice(1));
          }
        });
      }
    }
    profileData.interests = Array.from(interests);

    // Extract phone number
    const phonePatterns = [
      /(?:phone|number|call me at)\s*[:\-]?\s*([\d\-\(\)\s]+)/i,
      /(\+?1?[\s\-]?\(?[\d]{3}\)?[\s\-]?[\d]{3}[\s\-]?[\d]{4})/,
    ];
    for (const pattern of phonePatterns) {
      const match = text.match(pattern);
      if (match) {
        const phone = match[1].trim();
        if (phone.length >= 10) {
          profileData.phoneNumber = phone;
          break;
        }
      }
    }

    // Extract emergency contact
    const emergencyPatterns = [
      /emergency contact\s*[:\-]?\s*([^.]+)/i,
      /in case of emergency\s*[:\-]?\s*([^.]+)/i,
    ];
    for (const pattern of emergencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        profileData.emergencyContact = match[1].trim();
        break;
      }
    }

    // Only return profile data if we actually extracted meaningful information
    const hasValidData = (
      profileData.name || 
      profileData.age || 
      profileData.location || 
      profileData.occupation || 
      profileData.bio ||
      Object.keys(profileData.lifestyle).length > 0 ||
      Object.keys(profileData.preferences).length > 0 ||
      profileData.interests.length > 0
    );

    if (!hasValidData) {
      console.log("No meaningful profile data extracted from transcription");
      return null;
    }

    // Only set defaults for fields that have some extracted data
    if (Object.keys(profileData.lifestyle).length > 0) {
      profileData.lifestyle.cleanliness = profileData.lifestyle.cleanliness || 3;
      profileData.lifestyle.socialLevel = profileData.lifestyle.socialLevel || 3;
      profileData.lifestyle.musicLevel = profileData.lifestyle.musicLevel || 3;
    }
    
    if (Object.keys(profileData.preferences).length > 0) {
      profileData.preferences.ageRange = profileData.preferences.ageRange || [22, 35];
      profileData.preferences.locationRadius = profileData.preferences.locationRadius || 25;
    }

    return profileData;
  }
}

export const voiceService = new VoiceService();