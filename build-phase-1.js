const fs = require('fs');
const path = require('path');

const files = {
  'phases/phase-1-backend-setup/package.json': `{
  "name": "noqueue-phase-1",
  "version": "1.0.0",
  "description": "NoQueue Phase 1: Core backend configuration, database schemas, and foundational middleware",
  "main": "server.js",
  "type": "commonjs",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "express-validator": "^7.2.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.9.5",
    "socket.io": "^4.8.1"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    "eslint": "^8.57.1",
    "jest": "^29.7.0",
    "mongodb-memory-server": "^10.1.3",
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`,

  'phases/phase-1-backend-setup/.env.example': `PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/noqueue
JWT_SECRET=supersecretjwtkey_change_in_production_min32chars
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=20
`,

  'phases/phase-1-backend-setup/server.js': `const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');

const server = http.createServer(app);

const startServer = async () => {
  try {
    await connectDB();

    const PORT = env.PORT;
    server.listen(PORT, () => {
      console.log(\`[Phase 1 Archive Server] Running in \${env.NODE_ENV} mode on port \${PORT}\`);
      console.log(\`[Phase 1 Archive Server] Allowed client origin: \${env.CLIENT_URL}\`);
    });
  } catch (error) {
    console.error(\`[Phase 1 Server Startup Error]:\`, error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
  process.exit(1);
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };
`,

  'phases/phase-1-backend-setup/src/app.js': `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to NoQueue API v1 (Phase 1 Baseline)',
  });
});

app.use('/api/auth', (req, res, next) => next());
app.use('/api/locations', (req, res, next) => next());
app.use('/api/queues', (req, res, next) => next());
app.use('/api/predictions', (req, res, next) => next());
app.use('/api/analytics', (req, res, next) => next());

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
`,

  'phases/phase-1-backend-setup/src/config/env.js': `const dotenv = require('dotenv');

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/noqueue',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_fallback_key_32_characters_minimum',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20,
};

module.exports = env;
`,

  'phases/phase-1-backend-setup/src/config/db.js': `const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async (customUri = null) => {
  const uri = customUri || env.MONGODB_URI;

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(uri, {
      autoIndex: true,
    });
    if (env.NODE_ENV !== 'test') {
      console.log(\`[Database] MongoDB Connected: \${conn.connection.host}/\${conn.connection.name}\`);
    }
    return conn;
  } catch (error) {
    console.error(\`[Database Error] Failed to connect: \${error.message}\`);
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
    console.error(\`[Database Error] Failed to close connection: \${error.message}\`);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};
`,

  'phases/phase-1-backend-setup/src/models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
`,

  'phases/phase-1-backend-setup/src/models/Location.js': `const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [120, 'Location name cannot exceed 120 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['hospital', 'bank', 'government', 'restaurant', 'retail', 'other'],
        message: '{VALUE} is not a supported category',
      },
      default: 'other',
    },
    status: {
      type: String,
      enum: {
        values: ['open', 'paused', 'closed'],
        message: '{VALUE} is not a valid queue status',
      },
      default: 'open',
    },
    avgServiceTime: {
      type: Number,
      required: [true, 'Default average service time (in minutes) is required'],
      min: [1, 'Average service time must be at least 1 minute'],
      max: [180, 'Average service time cannot exceed 180 minutes'],
      default: 10,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator user ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ status: 1 });
locationSchema.index({ category: 1 });
locationSchema.index({ name: 'text', address: 'text' });

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
`,

  'phases/phase-1-backend-setup/src/models/QueueEntry.js': `const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['waiting', 'called', 'served', 'cancelled', 'no_show'],
        message: '{VALUE} is not a valid status',
      },
      default: 'waiting',
      required: true,
    },
    position: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokenNumber: {
      type: String,
      required: [true, 'Token number is required'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    servedAt: {
      type: Date,
      default: null,
    },
    serviceDuration: {
      type: Number,
      default: null,
      min: 0,
    },
    hourOfDay: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    queueLengthAtJoin: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

queueEntrySchema.index({ location: 1, status: 1, joinedAt: 1 });
queueEntrySchema.index({ user: 1, status: 1 });
queueEntrySchema.index({ location: 1, dayOfWeek: 1, hourOfDay: 1, status: 1 });
queueEntrySchema.index({ joinedAt: 1 });

const QueueEntry = mongoose.model('QueueEntry', queueEntrySchema);

module.exports = QueueEntry;
`,

  'phases/phase-1-backend-setup/src/middleware/auth.js': `const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing or invalid',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired' });
    }
    return res.status(500).json({ success: false, message: 'Internal server authentication error' });
  }
};

module.exports = authenticate;
`,

  'phases/phase-1-backend-setup/src/middleware/role.js': `const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: \`Forbidden: role '\${req.user.role}' is not authorized to access this resource\`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;
`,

  'phases/phase-1-backend-setup/src/middleware/validate.js': `const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors,
  });
};

module.exports = validate;
`,

  'phases/phase-1-backend-setup/src/middleware/rateLimiter.js': `const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
};
`,

  'phases/phase-1-backend-setup/src/middleware/errorHandler.js': `const env = require('../config/env');

const notFoundHandler = (req, res, next) => {
  const error = new Error(\`Resource not found - \${req.originalUrl}\`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found: Invalid ID format';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = \`Duplicate value entered for \${duplicatedField}. Must be unique.\`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
`
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.resolve(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`Created: ${filePath}`);
});

console.log('\\nSuccessfully generated all Phase 1 files in phases/phase-1-backend-setup/');