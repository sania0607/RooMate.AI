import { storage } from "../storage";

export class CompatibilityService {
  async calculateCompatibility(user1Id: string, user2Id: string): Promise<number> {
    try {
      const profile1 = await storage.getUserProfile(user1Id);
      const profile2 = await storage.getUserProfile(user2Id);

      if (!profile1 || !profile2) {
        return 0;
      }

      let score = 0;
      let factors = 0;

      // Age compatibility (10% weight)
      if (profile1.age && profile2.age) {
        const ageDiff = Math.abs(profile1.age - profile2.age);
        if (ageDiff <= 3) score += 10;
        else if (ageDiff <= 5) score += 7;
        else if (ageDiff <= 8) score += 4;
        factors++;
      }

      // Location compatibility (15% weight)
      if (profile1.location && profile2.location) {
        if (profile1.location.toLowerCase().includes(profile2.location.toLowerCase()) ||
            profile2.location.toLowerCase().includes(profile1.location.toLowerCase())) {
          score += 15;
        } else {
          score += 5; // Different areas but potentially same city
        }
        factors++;
      }

      // Lifestyle compatibility (50% weight)
      if (profile1.lifestyle && profile2.lifestyle) {
        let lifestyleScore = 0;
        let lifestyleFactors = 0;

        // Cleanliness compatibility
        if (profile1.lifestyle.cleanliness && profile2.lifestyle.cleanliness) {
          const diff = Math.abs(profile1.lifestyle.cleanliness - profile2.lifestyle.cleanliness);
          lifestyleScore += Math.max(0, 10 - diff * 2);
          lifestyleFactors++;
        }

        // Social level compatibility
        if (profile1.lifestyle.socialLevel && profile2.lifestyle.socialLevel) {
          const diff = Math.abs(profile1.lifestyle.socialLevel - profile2.lifestyle.socialLevel);
          lifestyleScore += Math.max(0, 10 - diff * 2);
          lifestyleFactors++;
        }

        // Sleep schedule compatibility
        if (profile1.lifestyle.sleepSchedule && profile2.lifestyle.sleepSchedule) {
          if (profile1.lifestyle.sleepSchedule === profile2.lifestyle.sleepSchedule) {
            lifestyleScore += 10;
          } else {
            lifestyleScore += 3; // Different but manageable
          }
          lifestyleFactors++;
        }

        // Deal breakers check
        let dealBreakerPenalty = 0;
        if (profile1.preferences?.dealBreakers && profile2.lifestyle) {
          if (profile1.preferences.dealBreakers.includes('smoking') && profile2.lifestyle.smoking) {
            dealBreakerPenalty += 20;
          }
          if (profile1.preferences.dealBreakers.includes('pets') && profile2.lifestyle.pets) {
            dealBreakerPenalty += 15;
          }
          if (profile1.preferences.dealBreakers.includes('parties') && profile2.lifestyle.socialLevel > 3) {
            dealBreakerPenalty += 10;
          }
        }

        if (profile2.preferences?.dealBreakers && profile1.lifestyle) {
          if (profile2.preferences.dealBreakers.includes('smoking') && profile1.lifestyle.smoking) {
            dealBreakerPenalty += 20;
          }
          if (profile2.preferences.dealBreakers.includes('pets') && profile1.lifestyle.pets) {
            dealBreakerPenalty += 15;
          }
          if (profile2.preferences.dealBreakers.includes('parties') && profile1.lifestyle.socialLevel > 3) {
            dealBreakerPenalty += 10;
          }
        }

        if (lifestyleFactors > 0) {
          const avgLifestyleScore = (lifestyleScore / lifestyleFactors) * 5; // Scale to 50%
          score += Math.max(0, avgLifestyleScore - dealBreakerPenalty);
        }
        factors++;
      }

      // Budget compatibility (15% weight)
      if (profile1.preferences?.budgetRange && profile2.preferences?.budgetRange) {
        const [min1, max1] = profile1.preferences.budgetRange;
        const [min2, max2] = profile2.preferences.budgetRange;
        
        // Check for overlap
        const overlapMin = Math.max(min1, min2);
        const overlapMax = Math.min(max1, max2);
        
        if (overlapMax >= overlapMin) {
          const overlapSize = overlapMax - overlapMin;
          const totalRange = Math.max(max1 - min1, max2 - min2);
          score += (overlapSize / totalRange) * 15;
        }
        factors++;
      }

      // Shared interests/tags (10% weight)
      if (profile1.tags && profile2.tags && profile1.tags.length > 0 && profile2.tags.length > 0) {
        const commonTags = profile1.tags.filter(tag => profile2.tags?.includes(tag));
        const totalUniqueTags = new Set([...profile1.tags, ...(profile2.tags || [])]).size;
        if (totalUniqueTags > 0) {
          score += (commonTags.length / totalUniqueTags) * 10;
        }
        factors++;
      }

      // Normalize score
      const finalScore = factors > 0 ? Math.min(100, Math.max(0, score)) : 0;
      return Math.round(finalScore * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      return 0;
    }
  }

  getCompatibilityFlags(user1Id: string, user2Id: string): Promise<{
    greenFlags: string[];
    redFlags: string[];
  }> {
    // This would be implemented to return specific compatibility indicators
    // For now, return a basic implementation
    return Promise.resolve({
      greenFlags: ["Similar age", "Same city", "Both clean"],
      redFlags: ["Different sleep schedules"]
    });
  }
}

export const compatibilityService = new CompatibilityService();
