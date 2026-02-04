const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel',
  },
  recipientModel: {
    type: String,
    enum: ['User', 'Hospital', 'BloodBank', 'Donor', 'College'],
    required: true,
  },
  recipientRole: {
    type: String,
    enum: ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'],
    required: true,
  },
  type: {
    type: String,
    enum: [
      'blood_request',
      'request_fulfilled',
      'donor_needed',
      'appointment_reminder',
      'inventory_alert',
      'test_result',
      'emergency',
      'system',
      'escalation',
      'reservation_expired',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  relatedEntityType: {
    type: String,
    enum: ['BloodRequest', 'Donation', 'Appointment', 'Inventory', null],
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  actionUrl: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ recipientId: 1, recipientModel: 1 });
notificationSchema.index({ recipientRole: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

