const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userRole: {
    type: String,
    enum: ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'],
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'fulfill_request',
      'issue_blood',
      'test_blood',
      'mobilize_donors',
      'escalate',
      'reserve_inventory',
      'cancel_request',
    ],
  },
  entityType: {
    type: String,
    enum: [
      'User',
      'Hospital',
      'BloodBank',
      'Donor',
      'College',
      'BloodRequest',
      'Inventory',
      'Donation',
      'Appointment',
      'Notification',
    ],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: false, // We use custom timestamp field
});

// Indexes
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ userRole: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

