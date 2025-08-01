import { Router } from "express";
import { db } from "../db";
import { notifications, users, userProfiles } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// GET /api/notifications - Get all notifications for the current user
router.get("/", async (req: any, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const userNotifications = await db
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
router.post("/:id/mark-read", async (req: any, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const notificationId = req.params.id;

    // Verify the notification belongs to the current user
    const notification = await db
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
    await db
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
router.post("/mark-all-read", async (req: any, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    await db
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
router.delete("/:id", async (req: any, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const notificationId = req.params.id;

    // Verify the notification belongs to the current user
    const notification = await db
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
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

// POST /api/notifications - Create a new notification (for system use)
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(["match", "message", "profile_view", "system"]),
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  relatedUserId: z.string().optional(),
});

router.post("/", async (req, res) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);

    const [newNotification] = await db
      .insert(notifications)
      .values(validatedData)
      .returning();

    res.status(201).json(newNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

export default router;