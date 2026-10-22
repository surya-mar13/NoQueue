const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (customUri = null) => {
  const uri = customUri || env.MONGODB_URI;

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    if (env.NODE_ENV !== 'test') {
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    }
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect: ${error.message}`);
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
  } catch (error) {
    console.error(`[Database Error] Failed to close connection: ${error.message}`);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
