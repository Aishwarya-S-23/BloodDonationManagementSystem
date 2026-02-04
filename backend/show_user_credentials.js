const mongoose = require('mongoose');
const User = require('./models/User');

async function showUserCredentials() {
  try {
    await mongoose.connect('mongodb://localhost:27017/bloodconnect?retryWrites=false');
    console.log('Connected to database');

    // Get all users
    const users = await User.find({}, 'email role isActive profileId createdAt').sort({ createdAt: -1 });

    console.log('\n🔐 BLOODCONNECT USER ACCOUNTS');
    console.log('==============================\n');

    console.log('📧 DEMO ACCOUNTS (Password: Demo123!)');
    console.log('=====================================');
    const demoAccounts = users.filter(user =>
      user.email.includes('demo.') && user.email.includes('@bloodconnect.com')
    );

    demoAccounts.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: Demo123!`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Profile: ${user.profileId ? '✅ Complete' : '❌ Missing'}`);
      console.log('');
    });

    console.log('📧 REGULAR ACCOUNTS (Password: Password@123)');
    console.log('===========================================');
    const regularAccounts = users.filter(user =>
      !user.email.includes('demo.') &&
      !user.email.includes('@example.com') &&
      user.email !== 'admin@example.com' &&
      user.email !== 'test@example.com'
    );

    regularAccounts.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: Password@123`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Profile: ${user.profileId ? '✅ Complete' : '❌ Missing'}`);
      console.log('');
    });

    console.log('📧 TEST ACCOUNTS (Various passwords)');
    console.log('====================================');
    const testAccounts = users.filter(user =>
      user.email.includes('@example.com') ||
      user.email === 'admin@example.com' ||
      user.email === 'test@example.com'
    );

    testAccounts.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password: Password@123 (or Demo123! for test@example.com)`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Profile: ${user.profileId ? '✅ Complete' : '❌ Missing'}`);
      console.log('');
    });

    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`Total Users: ${users.length}`);
    console.log(`Demo Accounts: ${demoAccounts.length}`);
    console.log(`Regular Accounts: ${regularAccounts.length}`);
    console.log(`Test Accounts: ${testAccounts.length}`);

    console.log('\n🔑 QUICK REFERENCE:');
    console.log('==================');
    console.log('• Demo accounts: Use password "Demo123!"');
    console.log('• Regular accounts: Use password "Password@123"');
    console.log('• All accounts are active and have profiles');

    console.log('\n🌐 Application URL: http://localhost:3000');

    await mongoose.disconnect();

  } catch (error) {
    console.error('Error:', error.message);
  }
}

showUserCredentials();
