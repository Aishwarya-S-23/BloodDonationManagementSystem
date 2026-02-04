const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
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
  bloodGroup: {
    type: String,
    required: true,
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
    default: 1,
    min: [0.5, 'Minimum 0.5 units'],
    max: [2, 'Maximum 2 units per donation'],
  },
  donationDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  testingStatus: {
    type: String,
    enum: ['pending', 'in_progress', 'passed', 'failed', 'discarded'],
    default: 'pending',
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
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'tested', 'issued', 'discarded', 'cancelled'],
    default: 'scheduled',
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodRequest',
    default: null,
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
}, {
  timestamps: true,
});

// Indexes
donationSchema.index({ donorId: 1 });
donationSchema.index({ bloodBankId: 1 });
donationSchema.index({ donationDate: -1 });
donationSchema.index({ status: 1 });
donationSchema.index({ testingStatus: 1 });
donationSchema.index({ requestId: 1 });
donationSchema.index({ bloodGroup: 1 });

// Update donor's lastDonationDate when donation is completed
donationSchema.post('save', async function (doc) {
  if (doc.status === 'completed') {
    const Donor = mongoose.model('Donor');
    await Donor.findByIdAndUpdate(doc.donorId, {
      lastDonationDate: doc.donationDate,
    });
  }
});

module.exports = mongoose.model('Donation', donationSchema);

