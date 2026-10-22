const { Server } = require('socket.io');
const socketAuthMiddleware = require('./socketAuth');
const QueueEntry = require('../models/QueueEntry');
const Location = require('../models/Location');
const predictionService = require('../services/predictionService');

let ioInstance = null;

const initSocket = (server, clientOrigin) => {
  const io = new Server(server, {
    cors: {
      origin: clientOrigin || ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    // Join location room
    socket.on('queue:join', async ({ locationId }) => {
      if (!locationId) return;
      const room = `queue:${locationId}`;
      socket.join(room);

      // Emit snapshot of current user's live position if waiting
      try {
        const entry = await QueueEntry.findOne({
          location: locationId,
          user: socket.user.id,
          status: { $in: ['waiting', 'called'] },
        }).lean();

        if (entry) {
          socket.emit('position:update', {
            entryId: entry._id,
            position: entry.position,
            status: entry.status,
            tokenNumber: entry.tokenNumber,
          });
        }
      } catch (err) {
        // Log quietly without breaking connection
      }
    });

    // Leave location room
    socket.on('queue:leave', ({ locationId }) => {
      if (!locationId) return;
      socket.leave(`queue:${locationId}`);
    });

    // User disconnections
    socket.on('disconnect', () => {
      // Disconnection handled automatically by Socket.io room management
    });
  });

  ioInstance = io;
  return io;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};

/**
 * Broadcast refreshed queue state and positions across all clients in a location room
 */
const broadcastQueueUpdate = async (locationId) => {
  if (!ioInstance) return;

  const room = `queue:${locationId}`;

  try {
    const [location, waitingEntries, calledEntry] = await Promise.all([
      Location.findById(locationId).lean(),
      QueueEntry.find({ location: locationId, status: 'waiting' })
        .sort({ joinedAt: 1 })
        .populate('user', 'name')
        .lean(),
      QueueEntry.findOne({ location: locationId, status: 'called' })
        .populate('user', 'name')
        .lean(),
    ]);

    if (!location) return;

    // Calculate updated wait time estimate for position 1
    const { avgWaitPerPerson } = await predictionService.predictWaitTime(locationId, 1);

    // Broadcast room summary
    ioInstance.to(room).emit('queue:updated', {
      locationId,
      queueLength: waitingEntries.length,
      estimatedWaitTime: waitingEntries.length * avgWaitPerPerson,
      status: location.status,
      currentlyServing: calledEntry
        ? {
            tokenNumber: calledEntry.tokenNumber,
            calledAt: calledEntry.calledAt,
            userName: calledEntry.user?.name,
          }
        : null,
    });

    // Notify each waiting socket user individually of their new position and ETA
    waitingEntries.forEach((entry, idx) => {
      const position = idx + 1;
      const etaMinutes = position * avgWaitPerPerson;

      ioInstance.to(room).emit(`user:position:${entry.user._id}`, {
        entryId: entry._id,
        position,
        estimatedWaitMinutes: etaMinutes,
        status: 'waiting',
      });
    });

    // If there is an active called entry, notify that specific user
    if (calledEntry) {
      ioInstance.to(room).emit(`user:called:${calledEntry.user._id}`, {
        entryId: calledEntry._id,
        tokenNumber: calledEntry.tokenNumber,
        status: 'called',
      });
    }
  } catch (err) {
    console.error(`[Socket Broadcast Error] Location: ${locationId}`, err.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastQueueUpdate,
};