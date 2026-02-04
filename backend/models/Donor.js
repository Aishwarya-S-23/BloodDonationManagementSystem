const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  eligibilityStatus: {
    type: String,
    enum: ['eligible', 'ineligible', 'temporary_ineligible', 'pending_verification'],
    default: 'pending_verification',
  },
  lastDonationDate: {
    type: Date,
    default: null,
  },
  cooldownDays: {
    type: Number,
    default: 56, // Standard cooldown period in days
  },
  healthStatus: {
    type: String,
    enum: ['healthy', 'under_medication', 'recent_illness', 'chronic_condition'],
    default: 'healthy',
  },
  address: {
    street: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String },
    country: { type: String, default: 'India' },
  },
  coordinates: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  availability: {
    type: String,
    enum: ['available', 'busy', 'unavailable'],
    default: 'available',
  },
  phone: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  weight: {
    type: Number,
    min: [45, 'Minimum weight must be 45kg'],
  },
}, {
  timestamps: true,
});

// Indexes
donorSchema.index({ bloodGroup: 1 });
donorSchema.index({ coordinates: '2dsphere' });
donorSchema.index({ eligibilityStatus: 1 });
donorSchema.index({ availability: 1 });
donorSchema.index({ lastDonationDate: 1 });

// Virtual for checking if donor can donate
donorSchema.virtual('canDonate').get(function () {
  if (this.eligibilityStatus !== 'eligible') return false;
  if (this.availability !== 'available') return false;
  if (!this.lastDonationDate) return true;
  
  const daysSinceLastDonation = Math.floor(
    (Date.now() - this.lastDonationDate) / (1000 * 60 * 60 * 24)
  );
  return daysSinceLastDonation >= this.cooldownDays;
});

donorSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Donor', donorSchema);

