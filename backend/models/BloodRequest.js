const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
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
    required: [true, 'Blood component is required'],
    default: 'whole',
  },
  units: {
    type: Number,
    required: [true, 'Number of units is required'],
    min: [1, 'At least 1 unit is required'],
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium',
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: [true, 'Location coordinates are required'],
    },
    address: {
      type: String,
      required: [true, 'Location address is required'],
    },
    geocoded: {
      type: Boolean,
      default: false,
    },
    geocodeSource: {
      type: String,
      enum: ['Mappls', 'OpenStreetMap'],
    },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired'],
    default: 'pending',
  },
  reservedUnits: { type: Number, default: 0 }, // units currently locked/reserved
  issuedUnits: { type: Number, default: 0 },   // units actually issued/delivered
  fulfillmentDetails: {
    type: {
      fulfilledUnits: { type: Number, default: 0 },
      pendingUnits: { type: Number, default: 0 },
      fulfillmentMethod: {
        type: String,
        enum: ['in_house', 'external_blood_bank', 'donor_mobilization', 'hospital_transfer', 'mixed'],
      },
      assignedBloodBanks: [{
        bloodBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodBank' },
        units: { type: Number },
        fulfilledUnits: { type: Number, default: 0 },
        status: { type: String, enum: ['assigned', 'fulfilled', 'cancelled'] },
      }],
      donorMobilization: {
        initiated: { type: Boolean, default: false },
        donorsNotified: { type: Number, default: 0 },
        appointmentsCreated: { type: Number, default: 0 },
      },
      collegeEscalation: {
        initiated: { type: Boolean, default: false },
        collegesNotified: [{
          collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
          notifiedAt: { type: Date },
        }],
      },
    },
    default: {
      fulfilledUnits: 0,
      pendingUnits: 0,
      fulfillmentMethod: undefined,
      assignedBloodBanks: [],
      donorMobilization: { initiated: false, donorsNotified: 0, appointmentsCreated: 0 },
      collegeEscalation: { initiated: false, collegesNotified: [] },
    },
  },
  history: [{
    status: { type: String },
    note: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  notes: {
    type: String,
    maxlength: 500,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
bloodRequestSchema.index({ hospitalId: 1 });
bloodRequestSchema.index({ status: 1 });
bloodRequestSchema.index({ bloodGroup: 1 });
bloodRequestSchema.index({ urgency: 1 });
bloodRequestSchema.index({ deadline: 1 });
bloodRequestSchema.index({ createdAt: -1 });
bloodRequestSchema.index({ 'fulfillmentDetails.assignedBloodBanks.bloodBankId': 1 });

// Geospatial index for location-based queries
bloodRequestSchema.index({ location: '2dsphere' });

// Auto-update pendingUnits
bloodRequestSchema.pre('save', function (next) {
  if (!this.fulfillmentDetails) {
    this.fulfillmentDetails = {
      fulfilledUnits: 0,
      pendingUnits: this.units,
      assignedBloodBanks: [],
      donorMobilization: { initiated: false, donorsNotified: 0, appointmentsCreated: 0 },
      collegeEscalation: { initiated: false, collegesNotified: [] },
    };
  }

  if (this.fulfillmentDetails.fulfilledUnits === undefined) {
    this.fulfillmentDetails.fulfilledUnits = 0;
  }

  // pending = requested - issued (not reserved)
  const issued = this.issuedUnits || 0;
  this.fulfillmentDetails.pendingUnits = Math.max(0, this.units - issued);

  // Auto-update status using issued units only
  if (issued >= this.units) {
    this.status = 'fulfilled';
  } else if (issued > 0) {
    this.status = 'partially_fulfilled';
  }

  next();
});

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);

