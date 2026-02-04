const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  component: {
    type: String,
    enum: ['whole', 'platelets', 'plasma', 'red_cells'],
    required: true,
    default: 'whole',
  },
  units: {
    type: Number,
    required: true,
    min: [0, 'Units cannot be negative'],
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['available', 'reserved', 'issued', 'expired', 'discarded'],
    default: 'available',
  },
  reservedQuantity: { type: Number, default: 0 }, // quantity currently locked for a request
  issuedQuantity: { type: Number, default: 0 },   // quantity actually issued
  source: {
    type: String,
    enum: ['donation', 'transfer', 'purchase'],
    required: true,
  },
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    default: null,
  },
  reservedFor: {
    requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
    reservedAt: { type: Date },
    expiresAt: { type: Date }, // Reservation expiry
    lockId: { type: String },  // deterministic lock for idempotency
  },
  batchNumber: {
    type: String,
    trim: true,
  },
  testResults: {
    hiv: { type: String, enum: ['negative', 'positive', 'pending'], default: 'pending' },
    hepatitisB: { type: String, enum: ['negative', 'positive', 'pending'], default: 'pending' },
    hepatitisC: { type: String, enum: ['negative', 'positive', 'pending'], default: 'pending' },
    syphilis: { type: String, enum: ['negative', 'positive', 'pending'], default: 'pending' },
    malaria: { type: String, enum: ['negative', 'positive', 'pending'], default: 'pending' },
    testedAt: { type: Date },
    testedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
}, {
  timestamps: true,
});

// Indexes
inventorySchema.index({ bloodBankId: 1 });
inventorySchema.index({ bloodGroup: 1, component: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ 'reservedFor.requestId': 1 });
inventorySchema.index({ donationId: 1 });
inventorySchema.index({ bloodBankId: 1, bloodGroup: 1, component: 1, status: 1 });

// Compound index for available inventory queries
inventorySchema.index({ 
  bloodBankId: 1, 
  bloodGroup: 1, 
  component: 1, 
  status: 1, 
  expiryDate: 1 
});

module.exports = mongoose.model('Inventory', inventorySchema);

