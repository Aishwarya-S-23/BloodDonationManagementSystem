const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true,
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    default: null,
  },
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderSentAt: {
    type: Date,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Indexes
appointmentSchema.index({ donorId: 1 });
appointmentSchema.index({ bloodBankId: 1 });
appointmentSchema.index({ scheduledDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ requestId: 1 });
appointmentSchema.index({ donationId: 1 });
appointmentSchema.index({ donorId: 1, scheduledDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);

