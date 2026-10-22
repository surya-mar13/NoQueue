const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/sockets/queueSocket');

const server = http.createServer(app);

// Initialize real-time Socket.io layer
initSocket(server, env.CLIENT_URL);

const startServer = async () => {
  try {
    await connectDB();
    const PORT = env.PORT;
    server.listen(PORT, () => {
      console.log(`[NoQueue Server] Running in ${env.NODE_ENV} mode on port ${PORT}`);
      console.log(`[NoQueue Server] Allowed client origin: ${env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error('[NoQueue Server Error]:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };