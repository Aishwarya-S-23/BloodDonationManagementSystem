const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
    validate: {
      validator: function(v) {
        // Password must contain at least one uppercase, one lowercase, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    enum: ['Admin', 'Hospital', 'BloodBank', 'Donor', 'College'],
    required: [true, 'Role is required'],
  },
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'profileModel',
  },
  profileModel: {
    type: String,
    enum: ['Hospital', 'BloodBank', 'Donor', 'College', null],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ profileId: 1, profileModel: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // If password already appears to be a bcrypt hash, skip re-hashing
  if (typeof this.password === 'string' && /^\$2[aby]\$/.test(this.password)) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

