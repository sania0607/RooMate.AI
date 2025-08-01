import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  password: varchar("password"), // For username/password authentication
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin table for secure admin panel access
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // Hashed admin password
  name: varchar("name").notNull(),
  email: varchar("email").unique(),
  role: varchar("role").default("admin"), // admin, super_admin
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User profiles with detailed information
export const userProfiles = pgTable("user_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name"), // User's display name
  profileImageUrl: varchar("profile_image_url"), // Profile picture URL
  additionalPhotos: text("additional_photos").array(), // Additional photos array
  age: integer("age"),
  location: varchar("location"),
  occupation: varchar("occupation"),
  education: varchar("education"),
  budget: varchar("budget"),
  bio: text("bio"),
  phoneNumber: varchar("phone_number"), // Additional contact info
  emergencyContact: varchar("emergency_contact"), // Emergency contact info
  languages: text("languages").array(), // Languages spoken
  interests: text("interests").array(), // Personal interests/hobbies
  // Enhanced basic info fields
  gender: varchar("gender"), // Added to basic info
  ageRange: varchar("age_range"), // Age range preference
  
  lifestyle: jsonb("lifestyle").$type<{
    // Cleanliness preferences
    cleanliness: number; // 1-5 scale
    cleanlinessImportance: "high" | "medium" | "low";
    
    // Social level preferences  
    socialLevel: number; // 1-5 scale
    socialLevelImportance: "high" | "medium" | "low";
    
    // Sleep schedule preferences
    sleepTime: string; // e.g., "22:00"
    wakeTime: string; // e.g., "07:00"
    sleepImportance: "high" | "medium" | "low";
    sleepSchedule?: string; // Optional legacy field
    
    // Work schedule
    workSchedule: string; // "9-5", "Remote", "Flexible", "Night Shift", etc.
    
    // Lifestyle habits
    pets: boolean;
    petType?: string; // Conditional: appears if pets=true
    smoking: boolean;
    drinking: boolean;
    drinkingFrequency?: string; // Conditional: appears if drinking=true
    
    // Living preferences
    roomType: "twin" | "single" | "no_preference";
    floorType: "quiet" | "lively" | "no_preference";
    
    // Additional lifestyle factors
    cooking: boolean;
    musicLevel: number;
    musicImportance: "high" | "medium" | "low";
    lifestyleTags: string[]; // Artsy, Techy, Fitness-focused, etc.
    
    // Guest policy
    guestPolicy: "frequently" | "occasionally" | "rarely" | "never";
  }>(),
  
  // Roommate preferences - what they want in a roommate
  roommatePreferences: jsonb("roommate_preferences").$type<{
    // Cleanliness preferences for roommate
    preferredCleanliness: number; // 1-5 scale
    cleanlinessImportance: "high" | "medium" | "low";
    
    // Social behavior preferences for roommate
    preferredSocialLevel: number; // 1-5 scale
    socialImportance: "high" | "medium" | "low";
    
    // Pet preferences
    okWithPets: boolean;
    petImportance: "high" | "medium" | "low";
    
    // Smoking preferences
    okWithSmoking: boolean;
    smokingImportance: "high" | "medium" | "low";
    
    // Sleep schedule alignment
    preferredSleepSchedule: "early_bird" | "night_owl" | "flexible";
    sleepImportance: "high" | "medium" | "low";
    
    // Guest policy preferences
    preferredGuestPolicy: "frequently" | "occasionally" | "rarely" | "never";
    guestImportance: "high" | "medium" | "low";
    
    // Interest matching preferences
    interestMatching: "very_important" | "somewhat_important" | "not_important";
    
    // Age and location preferences
    ageRange: [number, number];
    locationRadius: number;
    budgetRange: [number, number];
    
    // Deal breakers and must-haves
    dealBreakers: string[];
    mustHaves: string[];
  }>(),
  
  // Legacy preferences field for backward compatibility
  preferences: jsonb("preferences").$type<{
    ageRange: [number, number];
    locationRadius: number;
    budgetRange: [number, number];
    dealBreakers: string[];
    mustHaves: string[];
  }>(),
  tags: text("tags").array(),
  omnidimResponses: jsonb("omnidim_responses").$type<{
    sessionId?: string;
    responses: Array<{
      id: string;
      question: string;
      answer: string;
      timestamp: string;
      metadata?: any;
    }>;
    lastUpdated: string;
  }>(),
  isComplete: boolean("is_complete").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Swipe actions
export const swipes = pgTable("swipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  swiperId: varchar("swiper_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  swipedId: varchar("swiped_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // 'like', 'pass', 'super_like'
  createdAt: timestamp("created_at").defaultNow(),
});

// Matches when two users like each other
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  user2Id: varchar("user2_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  compatibilityScore: decimal("compatibility_score", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between matched users
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id, { onDelete: "cascade" }),
  senderId: varchar("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin flags and reports
export const userFlags = pgTable("user_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  flaggedById: varchar("flagged_by_id").references(() => users.id, { onDelete: "cascade" }),
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // 'pending', 'resolved', 'dismissed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications for users
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // 'match', 'message', 'profile_view', 'system'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  actionUrl: varchar("action_url"), // Optional URL to redirect when clicked
  relatedUserId: varchar("related_user_id").references(() => users.id, { onDelete: "cascade" }), // For match/message notifications
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  swipesGiven: many(swipes, { relationName: "swiper" }),
  swipesReceived: many(swipes, { relationName: "swiped" }),
  matchesAsUser1: many(matches, { relationName: "user1" }),
  matchesAsUser2: many(matches, { relationName: "user2" }),
  messages: many(messages),
  flags: many(userFlags),
  notifications: many(notifications),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const swipesRelations = relations(swipes, ({ one }) => ({
  swiper: one(users, {
    fields: [swipes.swiperId],
    references: [users.id],
    relationName: "swiper",
  }),
  swiped: one(users, {
    fields: [swipes.swipedId],
    references: [users.id],
    relationName: "swiped",
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id],
    relationName: "user1",
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id],
    relationName: "user2",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const userFlagsRelations = relations(userFlags, ({ one }) => ({
  user: one(users, {
    fields: [userFlags.userId],
    references: [users.id],
  }),
  flaggedBy: one(users, {
    fields: [userFlags.flaggedById],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSwipeSchema = createInsertSchema(swipes).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertUserFlagSchema = createInsertSchema(userFlags).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Authentication schemas
export const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type Swipe = typeof swipes.$inferSelect;
export type InsertSwipe = z.infer<typeof insertSwipeSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type UserFlag = typeof userFlags.$inferSelect;
export type InsertUserFlag = z.infer<typeof insertUserFlagSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;

// Room listings table for room tour feature
export const roomListings = pgTable("room_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  location: varchar("location").notNull(),
  rentPerHead: decimal("rent_per_head", { precision: 10, scale: 2 }).notNull(),
  totalRent: decimal("total_rent", { precision: 10, scale: 2 }),
  roomType: varchar("room_type").notNull(), // "single", "shared", "private"
  maxOccupancy: integer("max_occupancy").default(1),
  currentOccupancy: integer("current_occupancy").default(0),
  images: text("images").array(), // Array of image URLs
  facilities: text("facilities").array(), // Array of facilities like "WiFi", "AC", "Parking"
  nearbyPlaces: text("nearby_places").array(), // Array of nearby places like "Metro station", "Mall"
  contactInfo: jsonb("contact_info").$type<{
    phone?: string;
    email?: string;
    whatsapp?: string;
  }>(),
  availableFrom: timestamp("available_from"),
  isActive: boolean("is_active").default(true),
  postedBy: varchar("posted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRoomListingSchema = createInsertSchema(roomListings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type RoomListing = typeof roomListings.$inferSelect;
export type InsertRoomListing = z.infer<typeof insertRoomListingSchema>;
