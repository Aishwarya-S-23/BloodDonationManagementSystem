const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // NOTE:
    // - MongoDB transactions require a replica set.
    // - Retryable writes also require replica set or mongos.
    // To make local dev "just work" for a standalone MongoDB instance,
    // we default to disabling retryable writes.
    const defaultLocalUri = 'mongodb://localhost:27017/bloodconnect';
    const mongoURI = process.env.MONGODB_URI || defaultLocalUri;

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

