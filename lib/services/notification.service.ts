import { db } from "@/lib/db/drizzle";
import { notifications, type Notification } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface CreateNotificationData {
  userId: string;
  type: "item_submission" | "comment_reported" | "user_registered" | "payment_failed" | "system_alert";
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export class NotificationService {
  /**
   * Create a new notification
   */
  static async create(data: CreateNotificationData) {
    try {
      const newNotification = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          data: data.data ? JSON.stringify(data.data) : null,
        })
        .returning();

      return {
        success: true,
        notification: newNotification[0],
      };
    } catch (error) {
      console.error("Error creating notification:", error);
      return {
        success: false,
        error: "Failed to create notification",
      };
    }
  }

  /**
   * Create notification for item submission
   */
  static async createItemSubmissionNotification(
    adminUserId: string,
    itemId: string,
    itemName: string,
    submittedBy: string
  ) {
    return this.create({
      userId: adminUserId,
      type: "item_submission",
      title: "New Item Submission",
      message: `A new item "${itemName}" has been submitted by ${submittedBy} and requires review.`,
      data: {
        itemId,
        itemName,
        submittedBy,
        actionUrl: `/admin/items/${itemId}`,
      },
    });
  }

  /**
   * Create notification for reported comment
   */
  static async createCommentReportedNotification(
    adminUserId: string,
    commentId: string,
    commentContent: string,
    reportedBy: string
  ) {
    return this.create({
      userId: adminUserId,
      type: "comment_reported",
      title: "Comment Reported",
      message: `A comment has been reported by ${reportedBy} and requires review.`,
      data: {
        commentId,
        commentContent: commentContent.substring(0, 100) + "...",
        reportedBy,
        actionUrl: `/admin/comments/${commentId}`,
      },
    });
  }

  /**
   * Create notification for new user registration
   */
  static async createUserRegisteredNotification(
    adminUserId: string,
    userId: string,
    userEmail: string
  ) {
    return this.create({
      userId: adminUserId,
      type: "user_registered",
      title: "New User Registration",
      message: `A new user has registered with email: ${userEmail}`,
      data: {
        userId,
        userEmail,
        actionUrl: `/admin/users/${userId}`,
      },
    });
  }

  /**
   * Create notification for payment failure
   */
  static async createPaymentFailedNotification(
    adminUserId: string,
    userId: string,
    userEmail: string,
    amount: number,
    reason: string
  ) {
    return this.create({
      userId: adminUserId,
      type: "payment_failed",
      title: "Payment Failure",
      message: `Payment failed for user ${userEmail} (${amount} USD). Reason: ${reason}`,
      data: {
        userId,
        userEmail,
        amount,
        reason,
        actionUrl: `/admin/users/${userId}`,
      },
    });
  }

  /**
   * Create system alert notification
   */
  static async createSystemAlertNotification(
    adminUserId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ) {
    return this.create({
      userId: adminUserId,
      type: "system_alert",
      title,
      message,
      data,
    });
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId));

      const total = userNotifications.length;
      const unread = userNotifications.filter((n: Notification) => !n.isRead).length;
      
      const byType = userNotifications.reduce((acc: Record<string, number>, notification: Notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return { total, unread, byType };
    } catch (error) {
      console.error("Error getting notification stats:", error);
      return { total: 0, unread: 0, byType: {} };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string) {
    try {
      const updatedNotification = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      return {
        success: true,
        notification: updatedNotification[0],
      };
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return {
        success: false,
        error: "Failed to mark notification as read",
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string) {
    try {
      const updatedNotifications = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
          )
        )
        .returning();

      return {
        success: true,
        updatedCount: updatedNotifications.length,
      };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return {
        success: false,
        error: "Failed to mark all notifications as read",
      };
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async cleanupOldNotifications(daysOld: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedNotifications = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.isRead, true),
            // Add date condition when the field is available
            // lt(notifications.createdAt, cutoffDate)
          )
        )
        .returning();

      return {
        success: true,
        deletedCount: deletedNotifications.length,
      };
    } catch (error) {
      console.error("Error cleaning up old notifications:", error);
      return {
        success: false,
        error: "Failed to cleanup old notifications",
      };
    }
  }
}
