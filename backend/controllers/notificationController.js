const notificationService = require('../services/notificationService');

/**
 * Get user notifications
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.userId;
    const recipientRole = req.userRole;
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const result = await notificationService.getUserNotifications(
      userId,
      recipientRole,
      {
        limit: parseInt(limit),
        skip: parseInt(skip),
        unreadOnly: unreadOnly === 'true',
      }
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.userId;
    const recipientRole = req.userRole;

    const Notification = require('../models/Notification');
    await Notification.updateMany(
      {
        recipientId: userId,
        recipientRole,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

