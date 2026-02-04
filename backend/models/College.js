const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'College name is required'],
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
  coordinatorName: {
    type: String,
    required: [true, 'Coordinator name is required'],
  },
  coordinatorContact: {
    phone: { type: String, required: true },
    email: { type: String, required: true },
  },
  studentCount: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Indexes
collegeSchema.index({ coordinates: '2dsphere' });
collegeSchema.index({ isActive: 1 });

module.exports = mongoose.model('College', collegeSchema);

