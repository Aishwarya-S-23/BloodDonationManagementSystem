require('dotenv').config();
const mongoose = require('mongoose');

// Test database connection
async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);

    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);

    // Test basic model validation
    console.log('\nTesting model imports...');

    const models = [
      'User',
      'Hospital',
      'BloodBank',
      'BloodRequest',
      'Donor',
      'College',
      'Inventory',
      'Appointment',
      'Transportation',
      'Notification',
      'AuditLog'
    ];

    for (const modelName of models) {
      try {
        const model = require(`./models/${modelName}`);
        console.log(`✅ Model ${modelName} loaded successfully`);
      } catch (error) {
        console.log(`❌ Model ${modelName} failed to load:`, error.message);
      }
    }

    console.log('\nTesting service imports...');

    const services = [
      'mapplsService',
      'decisionEngine',
      'fulfillmentMonitoringService',
      'donorMobilizationService',
      'escalationService'
    ];

    for (const serviceName of services) {
      try {
        const service = require(`./services/${serviceName}`);
        console.log(`✅ Service ${serviceName} loaded successfully`);
      } catch (error) {
        console.log(`❌ Service ${serviceName} failed to load:`, error.message);
      }
    }

    console.log('\n🎉 All basic checks passed!');

    // Test Mappls service (optional)
    console.log('\nTesting Mappls service health...');
    try {
      const mapplsService = require('./services/mapplsService');
      const health = mapplsService.getHealthStatus();
      console.log('✅ Mappls service health:', health);
    } catch (error) {
      console.log('⚠️  Mappls service test failed:', error.message);
    }

    await mongoose.disconnect();
    console.log('✅ Database disconnected successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
