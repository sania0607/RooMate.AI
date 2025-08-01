import { db } from "../db";
import { notifications, users, userProfiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface CreateNotificationData {
  userId: string;
  type: 'match' | 'message' | 'profile_view' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  relatedUserId?: string;
}

export class NotificationService {
  // Create a new notification
  static async createNotification(data: CreateNotificationData) {
    try {
      const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Create match notification
  static async createMatchNotification(userId: string, matchedUserId: string, matchedUserName: string) {
    return this.createNotification({
      userId,
      type: 'match',
      title: '🎉 New Match!',
      message: `You have a new match with ${matchedUserName}! Start a conversation to get to know each other.`,
      actionUrl: '/matches',
      relatedUserId: matchedUserId,
    });
  }

  // Create message notification
  static async createMessageNotification(userId: string, senderId: string, senderName: string, messagePreview: string) {
    const preview = messagePreview.length > 50 
      ? messagePreview.substring(0, 50) + '...' 
      : messagePreview;
    
    return this.createNotification({
      userId,
      type: 'message',
      title: `New message from ${senderName}`,
      message: preview,
      actionUrl: `/messages/${senderId}`,
      relatedUserId: senderId,
    });
  }

  // Create profile view notification
  static async createProfileViewNotification(userId: string, viewerId: string, viewerName: string) {
    return this.createNotification({
      userId,
      type: 'profile_view',
      title: 'Someone viewed your profile',
      message: `${viewerName} checked out your profile. They might be interested!`,
      actionUrl: '/discover',
      relatedUserId: viewerId,
    });
  }

  // Create system notification
  static async createSystemNotification(userId: string, title: string, message: string, actionUrl?: string) {
    return this.createNotification({
      userId,
      type: 'system',
      title,
      message,
      actionUrl,
    });
  }

  // Get unread notification count for a user
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: notifications.id })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      
      return result.length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string, userId: string) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string) {
    try {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup function)
  static async deleteOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      await db
        .delete(notifications)
        .where(eq(notifications.isRead, true));
        // Add date filter when available in schema
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }
}