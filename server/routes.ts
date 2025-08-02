import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { setupSimpleAuth } from "./auth-simple";
import { voiceService } from "./services/voiceService";
import { compatibilityService } from "./services/compatibilityService";
import { omnidimService } from "./services/omnidimService";
import { insertUserProfileSchema, insertSwipeSchema, insertMessageSchema, insertUserFlagSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { NotificationService } from "./services/notificationService";
import { notifications, users } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  const { isAuthenticated } = setupSimpleAuth(app);

  // Admin authentication middleware
  const isAdminAuthenticated = (req: any, res: any, next: any) => {
    const adminSession = req.headers.authorization?.replace('Bearer ', '');
    if (!adminSession) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    try {
      const session = JSON.parse(adminSession);
      if (!session.adminId || !session.loginTime) {
        return res.status(401).json({ message: "Invalid admin session" });
      }

      // Check if session is not older than 8 hours
      const loginTime = new Date(session.loginTime);
      const now = new Date();
      const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 8) {
        return res.status(401).json({ message: "Admin session expired" });
      }

      req.admin = session;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Invalid admin session format" });
    }
  };

  // Admin login route
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const admin = await storage.getAdminByUsername(username);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid admin credentials" });
      }

      // Update last login
      await storage.updateAdminLastLogin(admin.id);

      res.json({
        adminId: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
        message: "Admin login successful"
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin logout route
  app.post('/api/admin/logout', (req, res) => {
    res.json({ message: "Admin logout successful" });
  });

  // Admin session validation endpoint
  app.get('/api/admin/validate', isAdminAuthenticated, (req: any, res) => {
    res.json({ 
      valid: true, 
      admin: {
        id: req.admin.adminId,
        username: req.admin.username,
        role: req.admin.role
      }
    });
  });

  // Notification routes - moved inline to ensure proper authentication
  
  // GET /api/notifications - Get all notifications for the current user
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userNotifications = await getDb()
        .select({
          id: notifications.id,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          actionUrl: notifications.actionUrl,
          createdAt: notifications.createdAt,
          relatedUser: {
            id: users.id,
            name: users.name,
            profileImageUrl: users.profileImageUrl,
          },
        })
        .from(notifications)
        .leftJoin(users, eq(notifications.relatedUserId, users.id))
        .where(eq(notifications.userId, req.user.id))
        .orderBy(desc(notifications.createdAt));

      // Transform data to match frontend interface
      const formattedNotifications = userNotifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
        userId: notification.relatedUser?.id,
        userImage: notification.relatedUser?.profileImageUrl,
        userName: notification.relatedUser?.name,
      }));

      res.json(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // POST /api/notifications/:id/mark-read - Mark a notification as read
  app.post("/api/notifications/:id/mark-read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = req.params.id;

      // Verify the notification belongs to the current user
      const notification = await getDb()
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, req.user.id)
          )
        )
        .limit(1);

      if (!notification.length) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Mark as read
      await getDb()
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notificationId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // POST /api/notifications/mark-all-read - Mark all notifications as read
  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req: any, res) => {
    try {
      await getDb()
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, req.user.id),
            eq(notifications.isRead, false)
          )
        );

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // DELETE /api/notifications/:id - Delete a notification
  app.delete("/api/notifications/:id", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = req.params.id;

      // Verify the notification belongs to the current user
      const notification = await getDb()
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, req.user.id)
          )
        )
        .limit(1);

      if (!notification.length) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Delete the notification
      await getDb()
        .delete(notifications)
        .where(eq(notifications.id, notificationId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Test endpoint to create sample notifications (for testing)
  app.post('/api/create-sample-notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Create sample notifications
      const sampleNotifications = [
        {
          userId,
          type: 'match' as const,
          title: '🎉 New Match!',
          message: 'You have a new match with Sarah! Start a conversation to get to know each other.',
          actionUrl: '/matches',
        },
        {
          userId,
          type: 'message' as const,
          title: 'New message from Emma',
          message: 'Hey! I saw we both love hiking. Want to grab coffee this weekend?',
          actionUrl: '/messages',
        },
        {
          userId,
          type: 'profile_view' as const,
          title: 'Someone viewed your profile',
          message: 'Alex checked out your profile. They might be interested!',
          actionUrl: '/discover',
        },
        {
          userId,
          type: 'system' as const,
          title: 'Profile Update Reminder',
          message: 'Complete your profile to get 3x more matches. Add more photos and interests!',
          actionUrl: '/profile',
        }
      ];

      // Create the notifications using the service
      for (const notification of sampleNotifications) {
        await NotificationService.createNotification(notification);
      }

      res.json({ message: 'Sample notifications created successfully' });
    } catch (error) {
      console.error('Error creating sample notifications:', error);
      res.status(500).json({ message: 'Failed to create sample notifications' });
    }
  });



  // Profile routes
  app.post('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Profile save request received from user:", req.user?.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const userId = req.user.id;
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log("Parsed profile data:", JSON.stringify(profileData, null, 2));
      
      const profile = await storage.createOrUpdateUserProfile(profileData);
      console.log("Profile saved successfully:", profile?.id);
      res.json(profile);
    } catch (error) {
      console.error("Error creating/updating profile:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Failed to create/update profile" });
      }
    }
  });

  app.put('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      console.log("Profile update request received from user:", req.user?.id);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      const userId = req.user.id;
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log("Parsed profile data:", JSON.stringify(profileData, null, 2));
      
      const profile = await storage.createOrUpdateUserProfile(profileData);
      console.log("Profile updated successfully:", profile?.id);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", error.errors);
        res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  });

  app.get('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Photo upload route
  app.post('/api/upload/profile-photo', isAuthenticated, async (req: any, res) => {
    try {
      const { image, filename } = req.body;
      
      if (!image || !filename) {
        return res.status(400).json({ message: "Image data and filename are required" });
      }

      // Extract base64 data (remove data URL prefix)
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Generate a unique filename
      const timestamp = Date.now();
      const fileExtension = filename.split('.').pop() || 'jpg';
      const uniqueFilename = `profile_${req.user.id}_${timestamp}.${fileExtension}`;
      
      // Create uploads directory if it doesn't exist
      const fs = await import('fs');
      const path = await import('path');
      
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save the file
      const filePath = path.join(uploadsDir, uniqueFilename);
      fs.writeFileSync(filePath, base64Data, 'base64');
      
      // Return the URL that can be used to access the image
      const imageUrl = `/uploads/${uniqueFilename}`;
      
      // Update user profile with the new photo URL
      const userId = req.user.id;
      const existingProfile = await storage.getUserProfile(userId);
      
      if (existingProfile) {
        // Update existing profile with new photo URL
        await storage.createOrUpdateUserProfile({
          ...existingProfile,
          userId,
          profileImageUrl: imageUrl
        });
      } else {
        // Create new profile with photo URL
        await storage.createOrUpdateUserProfile({
          userId,
          profileImageUrl: imageUrl
        });
      }
      
      res.json({ 
        message: "Photo uploaded successfully",
        imageUrl: imageUrl,
        filename: uniqueFilename
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Voice input route
  app.post('/api/voice/process', isAuthenticated, async (req: any, res) => {
    try {
      const { audioData } = req.body;
      const transcription = await voiceService.processVoiceInput(audioData);
      const profileData = await voiceService.extractProfileData(transcription);
      res.json({ transcription, profileData });
    } catch (error) {
      console.error("Error processing voice input:", error);
      res.status(500).json({ message: "Failed to process voice input" });
    }
  });

  // Omnidim voice assistant routes
  app.post('/api/omnidim/create-agent', isAuthenticated, async (req: any, res) => {
    try {
      const agent = await omnidimService.createRoommateMatchingAgent();
      res.json({ success: true, agent });
    } catch (error) {
      console.error("Error creating Omnidim agent:", error);
      res.status(500).json({ message: "Failed to create voice assistant agent" });
    }
  });

  app.post('/api/omnidim/start-call', isAuthenticated, async (req: any, res) => {
    try {
      const { agentId, phoneNumber } = req.body;
      const call = await omnidimService.initiateCall(agentId, phoneNumber);
      res.json({ success: true, call });
    } catch (error) {
      console.error("Error starting Omnidim call:", error);
      res.status(500).json({ message: "Failed to start voice call" });
    }
  });

  app.get('/api/omnidim/calls/:callId/status', isAuthenticated, async (req: any, res) => {
    try {
      const { callId } = req.params;
      const callStatus = await omnidimService.getCallStatus(callId);
      
      // Only save profile data if call is completed AND has real transcript
      if (callStatus.status === 'completed' && callStatus.transcript && callStatus.transcript.length > 100) {
        try {
          console.log('Call completed with real transcript, extracting profile data for user:', req.user.id);
          
          // Validate that transcript contains actual conversation, not mock data
          const transcriptLower = callStatus.transcript.toLowerCase();
          const hasMockData = transcriptLower.includes('sarah johnson') || 
                             transcriptLower.includes('[user responses would be here]') ||
                             transcriptLower.includes('mock transcript') ||
                             transcriptLower.includes('development');
          
          if (hasMockData) {
            console.log('Transcript contains mock data, not saving to profile');
            callStatus.profileUpdateError = 'Mock data detected - not saving to profile';
          } else {
            console.log('Processing real user transcript for profile update');
            const profileData = await omnidimService.extractProfileDataFromCall(callId);
            
            if (profileData && Object.keys(profileData).length > 2) {
              // Only save if we have substantial profile data
              const fullProfileData = insertUserProfileSchema.parse({
                ...profileData,
                userId: req.user.id,
                isComplete: true,
                updatedAt: new Date().toISOString()
              });
              
              const updatedProfile = await storage.createOrUpdateUserProfile(fullProfileData);
              console.log('Profile updated with real voice interview data:', updatedProfile?.id);
              
              callStatus.profileUpdated = true;
              callStatus.profileData = {
                isComplete: true,
                extractedFields: Object.keys(profileData),
                source: 'real_voice_interview'
              };
            } else {
              console.log('Insufficient profile data extracted from transcript');
              callStatus.profileUpdateError = 'Insufficient data in transcript';
            }
          }
        } catch (profileError) {
          console.error('Error processing voice interview data:', profileError);
          callStatus.profileUpdateError = 'Failed to process voice interview';
        }
      } else {
        console.log('Call not completed or transcript too short, not updating profile');
      }
      
      res.json(callStatus);
    } catch (error) {
      console.error("Error getting call status:", error);
      res.status(500).json({ message: "Failed to get call status" });
    }
  });

  // Process web-based voice interview
  app.post('/api/omnidim/process-interview', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { callId, transcript, responses } = req.body;
      
      console.log('Processing web voice interview for user:', userId);
      console.log('Interview responses:', responses);
      
      // Convert interview responses to profile data
      console.log('🔧 Converting interview responses to profile data:', responses);
      
      // Parse cleanliness and social level from responses
      const cleanlinessMatch = responses.cleanliness?.match(/(\d+)/);
      const cleanlinessLevel = cleanlinessMatch ? parseInt(cleanlinessMatch[1]) : null;
      
      const socialMatch = responses.socialLevel?.match(/(\d+)/);
      const socialLevel = socialMatch ? parseInt(socialMatch[1]) : null;
      
      // Only save data that was actually provided in responses - no defaults
      const profileData: any = {};
      
      // Only add name if provided and not empty
      if (responses.name && responses.name.trim() && responses.name.trim() !== '') {
        profileData.name = responses.name.trim();
      }
      
      // Only add age if specifically provided
      if (responses.age && !isNaN(parseInt(responses.age))) {
        const age = parseInt(responses.age);
        if (age >= 18 && age <= 65) {
          profileData.age = age;
        }
      }
      
      // Only add location if specifically provided
      if (responses.location && responses.location.trim() && responses.location.trim() !== '') {
        profileData.location = responses.location.trim();
      }
      
      // Only add bio if specifically provided
      if (responses.bio && responses.bio.trim() && responses.bio.trim() !== '') {
        profileData.bio = responses.bio.trim();
      }
      
      // Only add lifestyle data that was actually asked and answered
      const lifestyle: any = {};
      let hasLifestyleData = false;
      
      if (responses.cleanliness && cleanlinessLevel) {
        lifestyle.cleanliness = cleanlinessLevel;
        lifestyle.cleanlinessImportance = 'medium';
        hasLifestyleData = true;
      }
      
      if (responses.socialLevel && socialLevel) {
        lifestyle.socialLevel = socialLevel;
        lifestyle.socialLevelImportance = 'medium';
        hasLifestyleData = true;
      }
      
      if (responses.sleepTime && responses.sleepTime.trim()) {
        lifestyle.sleepTime = responses.sleepTime.trim();
        lifestyle.sleepImportance = 'medium';
        hasLifestyleData = true;
      }
      
      if (responses.pets && responses.pets.trim()) {
        lifestyle.pets = responses.pets.toLowerCase().includes('yes') || responses.pets.toLowerCase().includes('have');
        if (lifestyle.pets) {
          if (responses.pets.toLowerCase().includes('cat')) lifestyle.petType = 'cat';
          else if (responses.pets.toLowerCase().includes('dog')) lifestyle.petType = 'dog';
          else lifestyle.petType = 'other';
        }
        hasLifestyleData = true;
      }
      
      if (responses.roomType && responses.roomType.trim()) {
        lifestyle.roomType = responses.roomType.toLowerCase().includes('single') ? 'single' : 'shared';
        hasLifestyleData = true;
      }
      
      // Only add lifestyle if we have actual data
      if (hasLifestyleData) {
        profileData.lifestyle = lifestyle;
      }
      
      // Only add interests if provided
      if (responses.interests && responses.interests.trim()) {
        profileData.interests = responses.interests.split(/[,&]/).map((i: string) => i.trim()).filter((i: string) => i.length > 0);
      }

      // Only save to database if we have meaningful data
      const hasMeaningfulData = (
        profileData.name ||
        profileData.age ||
        profileData.location ||
        profileData.bio ||
        profileData.lifestyle ||
        (profileData.interests && profileData.interests.length > 0)
      );
      
      if (!hasMeaningfulData) {
        console.log('❌ No meaningful data to save from voice interview');
        return res.json({
          success: false,
          message: 'No meaningful profile data extracted from voice interview',
          debug: {
            originalResponses: responses,
            processedData: profileData
          }
        });
      }
      
      // Save to database
      console.log('💾 Saving profile data to database for user:', userId);
      const profile = await storage.createOrUpdateUserProfile({
        ...profileData,
        userId,
        isComplete: true,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Web voice interview processed and profile updated successfully');
      
      res.json({
        success: true,
        profileData,
        profile,
        message: 'Voice interview processed successfully',
        debug: {
          originalResponses: responses,
          processedData: profileData,
          profileId: profile?.id
        }
      });
    } catch (error) {
      console.error('Error processing web voice interview:', error);
      res.status(500).json({ 
        message: 'Failed to process voice interview',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/omnidim/process-transcript', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { callId, transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ message: "Transcript is required" });
      }

      // Extract profile data from transcript
      const profileData = omnidimService.extractProfileDataFromTranscript(transcript);
      
      // Save the profile data to database
      const updatedProfile = await storage.createOrUpdateUserProfile({
        ...profileData,
        userId,
        isComplete: true // Mark profile as complete after voice setup
      });

      // Note: Compatibility scoring will be calculated during matching

      res.json({ 
        success: true,
        profileData: updatedProfile,
        message: "Voice interview completed and profile updated successfully"
      });
    } catch (error) {
      console.error("Error processing transcript:", error);
      res.status(500).json({ message: "Failed to process voice interview" });
    }
  });

  // Omnidim response saving route
  app.post('/api/omnidim/response', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const omnidimData = req.body;
      
      // Validate that the response contains "roomo" (case insensitive)
      const responseText = omnidimData.answer || omnidimData.response || '';
      if (!responseText.toLowerCase().includes('roomo')) {
        return res.status(400).json({ 
          message: "Only responses containing 'roomo' are saved" 
        });
      }

      const updatedProfile = await storage.saveOmnidimResponse(userId, omnidimData);
      
      res.json({ 
        message: "Omnidim response saved successfully",
        profile: updatedProfile 
      });
    } catch (error) {
      console.error("Error saving Omnidim response:", error);
      res.status(500).json({ message: "Failed to save Omnidim response" });
    }
  });

  // Swipe and matching routes
  app.get('/api/swipe/candidates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const candidates = await storage.getSwipeCandidates(userId);
      res.json(candidates);
    } catch (error) {
      console.error("Error fetching swipe candidates:", error);
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Discover all users route
  app.get('/api/discover/users', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const users = await storage.getAllUsersForDiscover(userId);
      
      // Calculate real compatibility scores for each user
      const usersWithScores = await Promise.all(
        users.map(async (user) => {
          try {
            const compatibilityScore = await compatibilityService.calculateCompatibility(userId, user.id);
            return {
              ...user,
              compatibilityScore: Math.round(compatibilityScore) // Show real score
            };
          } catch (error) {
            console.error(`Error calculating compatibility for user ${user.id}:`, error);
            return {
              ...user,
              compatibilityScore: 75 // Default fallback score
            };
          }
        })
      );
      
      // Sort by compatibility score (highest first) and filter out very low scores
      const sortedUsers = usersWithScores.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      res.json(sortedUsers);
    } catch (error) {
      console.error("Error fetching users for discover:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create swipe action
  app.post('/api/swipe', isAuthenticated, async (req: any, res) => {
    try {
      const { swipedId, action } = req.body;
      const userId = req.user.id;

      console.log("Swipe request:", { userId, swipedId, action });

      if (!swipedId || !action) {
        return res.status(400).json({ message: "Missing swipedId or action" });
      }

      if (!['like', 'pass'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'like' or 'pass'" });
      }

      // Validate the swipe data using the schema
      const validatedSwipeData = insertSwipeSchema.parse({
        swiperId: userId,
        swipedId: swipedId,
        action: action
      });

      // Create the swipe record
      const swipe = await storage.createSwipe(validatedSwipeData);

      console.log("Swipe created:", swipe);

      // Check for mutual match if action was 'like'
      let match = null;
      if (action === 'like') {
        // Check if the other user also liked this user
        match = await storage.checkForMatch(userId, swipedId);
        if (match) {
          console.log("Match found:", match);
          // Calculate compatibility score using the service
          try {
            const score = await compatibilityService.calculateCompatibility(userId, swipedId);
            await storage.updateMatchCompatibilityScore(match.id, score);
          } catch (scoreError) {
            console.error("Error calculating compatibility score:", scoreError);
            // Continue without score calculation
          }
        }
      }

      res.json({ 
        success: true, 
        swipe: swipe,
        match: match ? {
          id: match.id,
          compatibilityScore: match.compatibilityScore || 95
        } : null
      });
    } catch (error: any) {
      console.error("Error creating swipe:", error);
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Invalid swipe data", 
          details: error.errors,
          received: { swipedId: req.body.swipedId, action: req.body.action, userId: req.user.id }
        });
      }
      
      res.status(500).json({ message: "Failed to process swipe", error: error.message });
    }
  });



  // Matches routes
  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const matches = await storage.getUserMatches(userId);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Start messaging route (creates a match if both users like each other or just starts a conversation)
  app.post('/api/messages/start', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.id;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot message yourself" });
      }
      
      // Check if there's already a match between these users
      let existingMatch = await storage.findMatchBetweenUsers(currentUserId, userId);
      
      if (!existingMatch) {
        // Create a new match so they can message each other
        const matchData = {
          user1Id: currentUserId,
          user2Id: userId,
        };
        existingMatch = await storage.createMatch(matchData);
        console.log("Created new match:", existingMatch.id);
      } else {
        console.log("Found existing match:", existingMatch.id);
      }
      
      res.json({ 
        message: "Conversation started successfully",
        matchId: existingMatch.id,
        redirectTo: `/messages/${existingMatch.id}`
      });
    } catch (error) {
      console.error("Error starting message:", error);
      res.status(500).json({ message: "Failed to start conversation" });
    }
  });

  // Messaging routes
  app.get('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const messages = await storage.getMatchMessages(matchId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/matches/:matchId/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { matchId } = req.params;
      
      // Verify user is part of this match
      const match = await storage.getMatch(matchId);
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const messageData = insertMessageSchema.parse({
        ...req.body,
        matchId,
        senderId: userId,
      });
      
      const message = await storage.createMessage(messageData);
      
      // Broadcast real-time message to all clients in the match room
      const room = matchRooms.get(matchId);
      if (room) {
        const broadcastData = {
          type: 'new_message',
          message: message,
          matchId: matchId
        };
        
        room.forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            try {
              client.send(JSON.stringify(broadcastData));
            } catch (wsError) {
              console.error('Error broadcasting message:', wsError);
            }
          }
        });
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // User stats endpoint
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getUserStats(req.user.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Secure Admin routes (protected by admin authentication)
  app.get('/api/admin/users', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { city, flags } = req.query;
      const users = await storage.getAllUsers({ city: city as string, flags: flags as string });
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/stats', isAdminAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post('/api/admin/flag-user', isAdminAuthenticated, async (req: any, res) => {
    try {
      const flagData = insertUserFlagSchema.parse({
        ...req.body,
        flaggedById: req.admin.adminId, // Use admin ID instead of user ID
      });
      
      const flag = await storage.createUserFlag(flagData);
      res.json(flag);
    } catch (error) {
      console.error("Error flagging user:", error);
      res.status(500).json({ message: "Failed to flag user" });
    }
  });

  app.put('/api/admin/flags/:flagId', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { flagId } = req.params;
      const { status } = req.body;
      
      const flag = await storage.updateUserFlag(flagId, { status });
      res.json(flag);
    } catch (error) {
      console.error("Error updating flag:", error);
      res.status(500).json({ message: "Failed to update flag" });
    }
  });

  // Additional admin management routes
  app.post('/api/admin/ban-user', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { userId, reason } = req.body;
      await storage.banUser(userId, reason, req.admin.adminId);
      res.json({ message: "User banned successfully" });
    } catch (error) {
      console.error("Error banning user:", error);
      res.status(500).json({ message: "Failed to ban user" });
    }
  });

  app.post('/api/admin/unban-user', isAdminAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.body;
      await storage.unbanUser(userId, req.admin.adminId);
      res.json({ message: "User unbanned successfully" });
    } catch (error) {
      console.error("Error unbanning user:", error);
      res.status(500).json({ message: "Failed to unban user" });
    }
  });

  // Room listings API routes
  app.get('/api/room-listings', async (req, res) => {
    try {
      const { limit, location, maxRent, roomType } = req.query;
      
      if (location || maxRent || roomType) {
        // Use search if filters are provided
        const listings = await storage.searchRoomListings({
          location: location as string,
          maxRent: maxRent ? parseInt(maxRent as string) : undefined,
          roomType: roomType as string,
        });
        res.json(listings);
      } else {
        // Get all listings
        const listings = await storage.getAllRoomListings(
          limit ? parseInt(limit as string) : undefined
        );
        res.json(listings);
      }
    } catch (error) {
      console.error("Error fetching room listings:", error);
      res.status(500).json({ message: "Failed to fetch room listings" });
    }
  });

  app.get('/api/room-listings/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.getRoomListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Room listing not found" });
      }
      
      res.json(listing);
    } catch (error) {
      console.error("Error fetching room listing:", error);
      res.status(500).json({ message: "Failed to fetch room listing" });
    }
  });

  app.post('/api/room-listings', isAuthenticated, async (req: any, res) => {
    try {
      const listingData = {
        ...req.body,
        postedBy: req.user.id,
      };
      
      const listing = await storage.createRoomListing(listingData);
      res.status(201).json(listing);
    } catch (error) {
      console.error("Error creating room listing:", error);
      res.status(500).json({ message: "Failed to create room listing" });
    }
  });

  app.put('/api/room-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.getRoomListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Room listing not found" });
      }
      
      // Check if user owns the listing or is admin
      if (listing.postedBy !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this listing" });
      }
      
      const updatedListing = await storage.updateRoomListing(id, req.body);
      res.json(updatedListing);
    } catch (error) {
      console.error("Error updating room listing:", error);
      res.status(500).json({ message: "Failed to update room listing" });
    }
  });

  app.delete('/api/room-listings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const listing = await storage.getRoomListing(id);
      
      if (!listing) {
        return res.status(404).json({ message: "Room listing not found" });
      }
      
      // Check if user owns the listing or is admin  
      if (listing.postedBy !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this listing" });
      }
      
      await storage.deleteRoomListing(id);
      res.json({ message: "Room listing deleted successfully" });
    } catch (error) {
      console.error("Error deleting room listing:", error);
      res.status(500).json({ message: "Failed to delete room listing" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const matchRooms = new Map<string, Set<any>>();
  
  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    let currentMatchId: string | null = null;
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join_match') {
          currentMatchId = data.matchId;
          
          // Add to match room
          if (currentMatchId && !matchRooms.has(currentMatchId)) {
            matchRooms.set(currentMatchId, new Set());
          }
          const roomSet = currentMatchId ? matchRooms.get(currentMatchId) : null;
          if (roomSet) {
            roomSet.add(ws);
          }
          
          console.log(`Client joined match room: ${currentMatchId}`);
        } else if (data.type === 'ping') {
          // Handle ping/pong for connection health
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      
      // Remove from match room
      if (currentMatchId && matchRooms.has(currentMatchId)) {
        const roomSet = matchRooms.get(currentMatchId);
        if (roomSet) {
          roomSet.delete(ws);
          
          // Clean up empty rooms
          if (roomSet.size === 0) {
            matchRooms.delete(currentMatchId);
          }
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
