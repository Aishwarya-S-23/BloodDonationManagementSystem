const mongoose = require('mongoose');

const transportationSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    required: true,
  },
  bloodBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true,
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  vehicleDetails: {
    type: {
      type: String,
      enum: ['ambulance', 'refrigerated_van', 'motorcycle', 'car'],
      required: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number, // units of blood that can be carried
      required: true,
    },
  },
  bloodUnits: [{
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
      required: true,
    },
    units: {
      type: Number,
      required: true,
      min: 0.5,
      max: 2,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    component: {
      type: String,
      enum: ['whole', 'platelets', 'plasma', 'red_cells'],
      required: true,
    },
  }],
  pickupLocation: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  deliveryLocation: {
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
    },
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
  },
  status: {
    type: String,
    enum: ['scheduled', 'dispatched', 'en_route', 'arrived', 'delivered', 'cancelled', 'failed'],
    default: 'scheduled',
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['scheduled', 'dispatched', 'en_route', 'arrived', 'delivered', 'cancelled', 'failed'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    notes: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  scheduledPickupTime: {
    type: Date,
    required: true,
  },
  actualPickupTime: {
    type: Date,
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true,
  },
  actualDeliveryTime: {
    type: Date,
  },
  distance: {
    type: Number, // in kilometers
    required: true,
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true,
  },
  actualDuration: {
    type: Number, // in minutes
  },
  temperatureLog: [{
    temperature: {
      type: Number, // in Celsius
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String,
  },
  specialInstructions: {
    type: String,
    maxlength: 500,
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal',
  },
  cost: {
    amount: Number,
    currency: {
      type: String,
      default: 'INR',
    },
    breakdown: {
      fuel: Number,
      maintenance: Number,
      labor: Number,
    },
  },
  issues: [{
    type: {
      type: String,
      enum: ['delay', 'temperature', 'damage', 'wrong_units', 'missing_units', 'other'],
    },
    description: String,
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolution: String,
  }],
}, {
  timestamps: true,
});

// Indexes
transportationSchema.index({ requestId: 1 });
transportationSchema.index({ bloodBankId: 1 });
transportationSchema.index({ hospitalId: 1 });
transportationSchema.index({ driverId: 1 });
transportationSchema.index({ status: 1 });
transportationSchema.index({ scheduledPickupTime: 1 });
transportationSchema.index({ estimatedDeliveryTime: 1 });
transportationSchema.index({ 'bloodUnits.inventoryId': 1 });

// Virtual for current location (latest status history entry with location)
transportationSchema.virtual('currentLocation').get(function() {
  const latestWithLocation = this.statusHistory
    .filter(entry => entry.location && entry.location.latitude && entry.location.longitude)
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  return latestWithLocation ? latestWithLocation.location : null;
});

// Method to update status with location tracking
transportationSchema.methods.updateStatus = function(newStatus, location = null, notes = null, updatedBy = null) {
  // Add to status history
  const historyEntry = {
    status: newStatus,
    timestamp: new Date(),
    notes,
    updatedBy,
  };

  if (location) {
    historyEntry.location = location;
  }

  this.statusHistory.push(historyEntry);
  this.status = newStatus;

  // Update actual times
  if (newStatus === 'arrived' && !this.actualPickupTime) {
    this.actualPickupTime = new Date();
  } else if (newStatus === 'delivered' && !this.actualDeliveryTime) {
    this.actualDeliveryTime = new Date();
    if (this.actualPickupTime) {
      this.actualDuration = Math.round((this.actualDeliveryTime - this.actualPickupTime) / (1000 * 60));
    }
  }

  return this.save();
};

// Method to log temperature
transportationSchema.methods.logTemperature = function(temperature, location = null) {
  const logEntry = {
    temperature,
    timestamp: new Date(),
  };

  if (location) {
    logEntry.location = location;
  }

  this.temperatureLog.push(logEntry);
  return this.save();
};

// Method to report issue
transportationSchema.methods.reportIssue = function(issueType, description, severity = 'medium') {
  this.issues.push({
    type: issueType,
    description,
    severity,
    reportedAt: new Date(),
  });

  // If critical issue, update priority
  if (severity === 'critical') {
    this.priority = 'critical';
  }

  return this.save();
};

module.exports = mongoose.model('Transportation', transportationSchema);
