import {
  users,
  userProfiles,
  swipes,
  matches,
  messages,
  userFlags,
  admins,
  roomListings,
  type User,
  type UpsertUser,
  type UserProfile,
  type InsertUserProfile,
  type Swipe,
  type InsertSwipe,
  type Match,
  type InsertMatch,
  type Message,
  type InsertMessage,
  type UserFlag,
  type InsertUserFlag,
  type RoomListing,
  type InsertRoomListing,
} from "@shared/schema";
import { eq, and, or, desc, asc, not, inArray, sql, isNotNull, isNull } from "drizzle-orm";

import { getDb } from "./db";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  
  // Profile operations
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createOrUpdateUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  saveOmnidimResponse(userId: string, omnidimData: any): Promise<UserProfile>;
  
  // Swipe and matching operations
  getSwipeCandidates(userId: string, limit?: number): Promise<any[]>;
  getAllUsersForDiscover(userId: string): Promise<any[]>;
  createSwipe(swipe: InsertSwipe): Promise<Swipe>;
  checkForMatch(userId: string, swipedUserId: string): Promise<Match | undefined>;
  updateMatchCompatibilityScore(matchId: string, score: number): Promise<Match>;
  getUserMatches(userId: string): Promise<any[]>;
  getMatch(matchId: string): Promise<Match | undefined>;
  
  // Message operations
  getMatchMessages(matchId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Admin operations
  getAllUsers(filters?: { city?: string; flags?: string }): Promise<any[]>;
  getAdminStats(): Promise<any>;
  getUserStats(userId: string): Promise<any>;
  createUserFlag(flag: InsertUserFlag): Promise<UserFlag>;
  updateUserFlag(flagId: string, updates: Partial<UserFlag>): Promise<UserFlag>;
  
  // Admin authentication
  getAdminByUsername(username: string): Promise<any>;
  updateAdminLastLogin(adminId: string): Promise<void>;
  banUser(userId: string, reason: string, adminId: string): Promise<void>;
  unbanUser(userId: string, adminId: string): Promise<void>;
  
  // Room listing operations
  getAllRoomListings(limit?: number): Promise<RoomListing[]>;
  getRoomListing(id: string): Promise<RoomListing | undefined>;
  createRoomListing(listing: InsertRoomListing): Promise<RoomListing>;
  updateRoomListing(id: string, updates: Partial<InsertRoomListing>): Promise<RoomListing>;
  deleteRoomListing(id: string): Promise<void>;
  searchRoomListings(filters: { location?: string; maxRent?: number; roomType?: string }): Promise<RoomListing[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await getDb().select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await getDb()
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (!email) return undefined;
    const [user] = await getDb().select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (!username) return undefined;
    const [user] = await getDb().select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const userToInsert = {
      id: userData.id,
      username: userData.username || '',
      name: userData.name || '',
      email: userData.email || null,
      profileImageUrl: userData.profileImageUrl || null,
      password: userData.password || null,
    };
    const [user] = await getDb().insert(users).values(userToInsert).returning();
    return user;
  }

  // Profile operations
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await getDb()
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createOrUpdateUserProfile(profileData: InsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(profileData.userId);
    
    if (existing) {
      const [updated] = await getDb()
        .update(userProfiles)
        .set({
          ...(profileData as any),
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, profileData.userId))
        .returning();
      return updated;
    } else {
      const [created] = await getDb()
        .insert(userProfiles)
        .values(profileData as any)
        .returning();
      return created;
    }
  }

  async saveOmnidimResponse(userId: string, omnidimData: any): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    
    const newResponse = {
      id: omnidimData.id || Date.now().toString(),
      question: omnidimData.question || '',
      answer: omnidimData.answer || omnidimData.response || '',
      timestamp: new Date().toISOString(),
      metadata: omnidimData.metadata || {}
    };

    let omnidimResponses;
    if (existing?.omnidimResponses) {
      // Add to existing responses
      omnidimResponses = {
        sessionId: existing.omnidimResponses.sessionId || omnidimData.sessionId,
        responses: [...existing.omnidimResponses.responses, newResponse],
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Create new responses array
      omnidimResponses = {
        sessionId: omnidimData.sessionId,
        responses: [newResponse],
        lastUpdated: new Date().toISOString()
      };
    }

    if (existing) {
      const [updated] = await getDb()
        .update(userProfiles)
        .set({
          omnidimResponses,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      // Create new profile with omnidim response
      const [created] = await getDb()
        .insert(userProfiles)
        .values({
          userId,
          omnidimResponses,
        } as any)
        .returning();
      return created;
    }
  }

  // Swipe and matching operations
  async getSwipeCandidates(userId: string, limit = 10): Promise<any[]> {
    // Get users that haven't been swiped on by current user
    const swipedUserIds = await getDb()
      .select({ swipedId: swipes.swipedId })
      .from(swipes)
      .where(eq(swipes.swiperId, userId));
    
    const swipedIds = swipedUserIds.map((s: any) => s.swipedId);
    swipedIds.push(userId); // Exclude self

    const candidates = await getDb()
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        and(
          not(inArray(users.id, swipedIds)),
          or(
            isNotNull(users.profileImageUrl), // Profile image in users table
            isNotNull(userProfiles.profileImageUrl) // Profile image in userProfiles table
          ),
          or(
            eq(userProfiles.isActive, true),
            isNull(userProfiles.isActive) // Include profiles where isActive is null (default)
          )
        )
      )
      .limit(limit);

    return candidates;
  }

  async getAllUsersForDiscover(userId: string): Promise<any[]> {
    // Get all users except the current user, with their profiles (only those with profile pictures)
    const allUsers = await getDb()
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(
        and(
          not(eq(users.id, userId)),
          or(
            isNotNull(users.profileImageUrl), // Profile image in users table
            isNotNull(userProfiles.profileImageUrl) // Profile image in userProfiles table
          ),
          or(
            eq(userProfiles.isActive, true),
            isNull(userProfiles.isActive) // Include profiles where isActive is null (default)
          )
          // Note: Removed isComplete check to show users even if profile is not complete
        )
      )
      .orderBy(desc(users.createdAt));

    return allUsers;
  }

  async createSwipe(swipeData: InsertSwipe): Promise<Swipe> {
    const [swipe] = await getDb()
      .insert(swipes)
      .values(swipeData)
      .returning();
    return swipe;
  }

  async checkForMatch(userId: string, swipedUserId: string): Promise<Match | undefined> {
    // Check if the swiped user has also liked the current user
    const [reciprocalSwipe] = await getDb()
      .select()
      .from(swipes)
      .where(
        and(
          eq(swipes.swiperId, swipedUserId),
          eq(swipes.swipedId, userId),
          eq(swipes.action, 'like')
        )
      );

    if (reciprocalSwipe) {
      // Create a match
      const [match] = await getDb()
        .insert(matches)
        .values({
          user1Id: userId,
          user2Id: swipedUserId,
          compatibilityScore: (Math.floor(Math.random() * 30) + 70).toString(), // Mock score 70-100%
        })
        .returning();
      return match;
    }

    return undefined;
  }

  async updateMatchCompatibilityScore(matchId: string, score: number): Promise<Match> {
    const [match] = await getDb()
      .update(matches)
      .set({ compatibilityScore: score.toString() })
      .where(eq(matches.id, matchId))
      .returning();
    return match;
  }

  async getUserMatches(userId: string): Promise<any[]> {
    // Get matches where user is either user1 or user2
    const userMatches = await getDb()
      .select({
        id: matches.id,
        user1Id: matches.user1Id,
        user2Id: matches.user2Id,
        compatibilityScore: matches.compatibilityScore,
        createdAt: matches.createdAt,
      })
      .from(matches)
      .where(or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)));

    // For each match, get the other user's info and profile
    const enrichedMatches = [];
    for (const match of userMatches) {
      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;
      
      const [otherUser] = await getDb()
        .select({
          id: users.id,
          name: users.name,
          username: users.username,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
          profile: userProfiles,
        })
        .from(users)
        .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
        .where(eq(users.id, otherUserId));

      enrichedMatches.push({
        ...match,
        user1: match.user1Id === userId ? null : otherUser,
        user2: match.user2Id === userId ? null : otherUser,
        currentUserId: userId
      });
    }

    return enrichedMatches;
  }

  // Find match between two users
  async findMatchBetweenUsers(user1Id: string, user2Id: string): Promise<Match | undefined> {
    const [match] = await getDb()
      .select()
      .from(matches)
      .where(
        or(
          and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
          and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
        )
      );
    return match;
  }

  // Create a new match
  async createMatch(matchData: { user1Id: string; user2Id: string }): Promise<Match> {
    const [match] = await getDb()
      .insert(matches)
      .values({
        ...matchData,
        compatibilityScore: (Math.floor(Math.random() * 30) + 70).toString(), // Mock score 70-100%
      })
      .returning();
    return match;
  }

  // Get a specific match by ID
  async getMatch(matchId: string): Promise<Match | undefined> {
    const [match] = await getDb()
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));
    return match;
  }

  // Message operations
  async getMatchMessages(matchId: string): Promise<any[]> {
    return await getDb()
      .select()
      .from(messages)
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);
  }

  async createMessage(messageData: any): Promise<any> {
    const [message] = await getDb()
      .insert(messages)
      .values(messageData)
      .returning();
    return message;
  }

  // Admin operations - Get all users for admin panel
  async getAllUsers(filters?: { city?: string; flags?: string }): Promise<any[]> {
    let query = getDb()
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        profile: userProfiles,
      })
      .from(users)
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    // Apply filters if provided
    const conditions = [];
    
    if (filters?.city) {
      conditions.push(sql`lower(${userProfiles.location}) like ${`%${filters.city.toLowerCase()}%`}`);
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const allUsers = await query.orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getAdminStats(): Promise<any> {
    // Get basic counts
    const [userCount] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [matchCount] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(eq(matches.isActive, true));

    const [flagCount] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(userFlags)
      .where(eq(userFlags.status, 'pending'));

    const [activeProfileCount] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(userProfiles)
      .where(eq(userProfiles.isActive, true));

    return {
      activeUsers: activeProfileCount.count || 0,
      successfulMatches: matchCount.count || 0,
      flaggedProfiles: flagCount.count || 0,
      userSatisfaction: 94.2, // This would be calculated from user feedback
    };
  }

  async getUserStats(userId: string): Promise<any> {
    // Get user's match count
    const userMatchesCount = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(matches)
      .where(
        and(
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          eq(matches.isActive, true)
        )
      );

    // Get user's unread message count
    const unreadMessagesCount = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .innerJoin(matches, eq(messages.matchId, matches.id))
      .where(
        and(
          or(eq(matches.user1Id, userId), eq(matches.user2Id, userId)),
          not(eq(messages.senderId, userId)),
          eq(messages.isRead, false)
        )
      );

    // Get total active users for context
    const [activeUsersCount] = await getDb()
      .select({ count: sql<number>`count(*)` })
      .from(userProfiles)
      .where(eq(userProfiles.isActive, true));

    // Get user's profile to calculate compatibility score
    const userProfile = await this.getUserProfile(userId);
    let compatibilityScore = 85; // Default score

    if (userProfile?.lifestyle) {
      // Calculate a rough compatibility score based on profile completeness
      const lifestyle = userProfile.lifestyle as any;
      let completeness = 0;
      const fields = ['cleanliness', 'socialLevel', 'sleepTime', 'wakeTime'];
      fields.forEach(field => {
        if (lifestyle[field] !== null && lifestyle[field] !== undefined) {
          completeness += 25;
        }
      });
      compatibilityScore = Math.min(95, 70 + completeness);
    }

    return {
      matchCount: userMatchesCount[0]?.count || 0,
      unreadMessages: unreadMessagesCount[0]?.count || 0,
      activeUsers: activeUsersCount.count || 0,
      compatibilityScore: compatibilityScore,
    };
  }

  async createUserFlag(flagData: InsertUserFlag): Promise<UserFlag> {
    const [flag] = await getDb()
      .insert(userFlags)
      .values(flagData)
      .returning();
    return flag;
  }

  async updateUserFlag(flagId: string, updates: Partial<UserFlag>): Promise<UserFlag> {
    const [updated] = await getDb()
      .update(userFlags)
      .set(updates)
      .where(eq(userFlags.id, flagId))
      .returning();
    return updated;
  }

  // Admin authentication methods
  async getAdminByUsername(username: string): Promise<any> {
    const [admin] = await getDb()
      .select()
      .from(admins)
      .where(eq(admins.username, username));
    return admin;
  }

  async updateAdminLastLogin(adminId: string): Promise<void> {
    await getDb()
      .update(admins)
      .set({ lastLogin: new Date() })
      .where(eq(admins.id, adminId));
  }

  async banUser(userId: string, reason: string, adminId: string): Promise<void> {
    // Add ban logic - create a flag with ban status
    await this.createUserFlag({
      userId,
      flaggedById: adminId,
      reason: 'BANNED',
      description: reason,
      status: 'resolved'
    });
  }

  async unbanUser(userId: string, adminId: string): Promise<void> {
    // Remove ban - mark previous ban flags as resolved
    await getDb()
      .update(userFlags)
      .set({ status: 'dismissed' })
      .where(and(
        eq(userFlags.userId, userId),
        eq(userFlags.reason, 'BANNED')
      ));
  }

  // Room listing operations
  async getAllRoomListings(limit: number = 50): Promise<RoomListing[]> {
    const listings = await getDb()
      .select()
      .from(roomListings)
      .where(eq(roomListings.isActive, true))
      .orderBy(desc(roomListings.createdAt))
      .limit(limit);
    return listings;
  }

  async getRoomListing(id: string): Promise<RoomListing | undefined> {
    const [listing] = await getDb()
      .select()
      .from(roomListings)
      .where(and(eq(roomListings.id, id), eq(roomListings.isActive, true)));
    return listing;
  }

  async createRoomListing(listingData: InsertRoomListing): Promise<RoomListing> {
    const insertData: any = { ...listingData };
    const [listing] = await getDb()
      .insert(roomListings)
      .values([insertData])
      .returning();
    return listing;
  }

  async updateRoomListing(id: string, updates: Partial<InsertRoomListing>): Promise<RoomListing> {
    const updateData: any = { ...updates, updatedAt: new Date() };
    const [listing] = await getDb()
      .update(roomListings)
      .set(updateData)
      .where(eq(roomListings.id, id))
      .returning();
    return listing;
  }

  async deleteRoomListing(id: string): Promise<void> {
    await getDb()
      .update(roomListings)
      .set({ isActive: false })
      .where(eq(roomListings.id, id));
  }

  async searchRoomListings(filters: { location?: string; maxRent?: number; roomType?: string }): Promise<RoomListing[]> {
    const conditions = [eq(roomListings.isActive, true)];
    
    if (filters.location) {
      conditions.push(sql`${roomListings.location} ILIKE ${'%' + filters.location + '%'}`);
    }
    
    if (filters.maxRent) {
      conditions.push(sql`${roomListings.rentPerHead} <= ${filters.maxRent}`);
    }
    
    if (filters.roomType) {
      conditions.push(eq(roomListings.roomType, filters.roomType));
    }
    
    const listings = await getDb()
      .select()
      .from(roomListings)
      .where(and(...conditions))
      .orderBy(desc(roomListings.createdAt));
    
    return listings;
  }
}

export const storage = new DatabaseStorage();
