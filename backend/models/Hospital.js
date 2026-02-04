const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Hospital name is required'],
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
  hasInHouseBloodBank: {
    type: Boolean,
    default: false,
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    default: null,
  },
  contact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
    emergencyContact: { type: String },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
hospitalSchema.index({ coordinates: '2dsphere' });
hospitalSchema.index({ bloodBankId: 1 });

module.exports = mongoose.model('Hospital', hospitalSchema);

