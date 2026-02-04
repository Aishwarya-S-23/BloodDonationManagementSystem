const mongoose = require('mongoose');

const bloodBankSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Blood bank name is required'],
    trim: true,
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true,
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  coordinates: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  testingCapability: {
    type: Boolean,
    default: true,
    required: true,
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    emergencyContact: { type: String },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  operatingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
  },
}, {
  timestamps: true,
});

// Indexes
bloodBankSchema.index({ coordinates: '2dsphere' });
bloodBankSchema.index({ status: 1 });

module.exports = mongoose.model('BloodBank', bloodBankSchema);

