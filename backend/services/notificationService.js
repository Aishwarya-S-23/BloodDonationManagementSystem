const Notification = require('../models/Notification');
const User = require('../models/User');
const twilio = require('twilio');

// Initialize Twilio client only if credentials are provided
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

/**
 * Create a notification
 */
const createNotification = async (notificationData) => {
  const notification = new Notification(notificationData);
  await notification.save();
  return notification;
};

/**
 * Send notification to multiple recipients
 */
const sendBulkNotifications = async (recipients, notificationData) => {
  const notifications = recipients.map((recipient) => ({
    ...notificationData,
    recipientId: recipient.userId || recipient._id,
    recipientModel: recipient.constructor.modelName || 'User',
    recipientRole: recipient.role || notificationData.recipientRole,
  }));

  const created = await Notification.insertMany(notifications);
  return created;
};

/**
 * Send SMS via Twilio
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn('Twilio not configured, skipping SMS');
      return null;
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return result;
  } catch (error) {
    console.error('SMS sending error:', error);
    throw error;
  }
};

/**
 * Send email via Twilio SendGrid (if configured)
 */
const sendEmail = async (to, subject, message) => {
  try {
    // Twilio SendGrid integration would go here
    // For now, we'll use a placeholder
    console.log(`Email would be sent to ${to}: ${subject} - ${message}`);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

/**
 * Send emergency notification (SMS + in-app)
 */
const sendEmergencyNotification = async (recipientId, recipientRole, notificationData) => {
  // Create in-app notification
  const notification = await createNotification({
    ...notificationData,
    recipientId,
    recipientRole,
    priority: 'urgent',
    type: 'emergency',
  });

  // Send SMS if recipient has phone
  try {
    const user = await User.findById(recipientId).populate('profileId');
    if (user && user.profileId) {
      const phone = user.profileId.phone || user.profileId.contact?.phone;
      if (phone) {
        await sendSMS(phone, `${notificationData.title}: ${notificationData.message}`);
      }
    }
  } catch (error) {
    console.error('Emergency SMS error:', error);
    // Don't fail if SMS fails
  }

  return notification;
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipientId: userId,
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  return notification;
};

/**
 * Get user notifications
 */
const getUserNotifications = async (userId, recipientRole, options = {}) => {
  const { limit = 50, skip = 0, unreadOnly = false } = options;

  const query = {
    recipientId: userId,
    recipientRole,
  };

  if (unreadOnly) {
    query.read = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);

  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    recipientRole,
    read: false,
  });

  return {
    notifications,
    unreadCount,
  };
};

module.exports = {
  createNotification,
  sendBulkNotifications,
  sendSMS,
  sendEmail,
  sendEmergencyNotification,
  markAsRead,
  getUserNotifications,
};

