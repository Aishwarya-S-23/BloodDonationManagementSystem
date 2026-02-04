const mongoose = require('mongoose');
require('dotenv').config();

// Import models to register them
require('./models/User');
require('./models/Hospital');
require('./models/BloodBank');
require('./models/Donor');
require('./models/College');

// Test user emails to clean up
const testEmails = [
  'admin@bloodconnect.test',
  'hospital@bloodconnect.test',
  'bloodbank@bloodconnect.test',
  'donor@bloodconnect.test',
  'college@bloodconnect.test'
];

async function cleanupTestUsers() {
  try {
    console.log('🧹 Cleaning up test users...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bloodconnect');
    console.log('✅ Connected to MongoDB');

    // Get all models
    const User = mongoose.model('User');
    const Hospital = mongoose.model('Hospital');
    const BloodBank = mongoose.model('BloodBank');
    const Donor = mongoose.model('Donor');
    const College = mongoose.model('College');

    // Find and delete test users
    for (const email of testEmails) {
      console.log(`Deleting user: ${email}`);

      // Find user
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        console.log(`  User ${email} not found, skipping...`);
        continue;
      }

      // Delete profile based on role
      if (user.profileId && user.profileModel) {
        const ProfileModel = mongoose.model(user.profileModel);
        await ProfileModel.findByIdAndDelete(user.profileId);
        console.log(`  Deleted ${user.profileModel} profile`);
      }

      // Delete user
      await User.findByIdAndDelete(user._id);
      console.log(`  Deleted user account`);
    }

    console.log('✅ Cleanup completed successfully');

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupTestUsers();
