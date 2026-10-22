# NoQueue

NoQueue is a real-time queue management application for places such as hospitals, banks, government offices, restaurants, and retail locations. Customers can find a location, join or leave a queue, track their position, and view estimated wait times. Vendors and administrators can manage locations, serve the next customer, update queue entries, and review analytics.

The project is organized as a Vite/React frontend and an Express/MongoDB backend. Socket.IO provides live queue updates, while the backend prediction service estimates wait times from queue activity and historical service data.

## Features

- JWT-based registration, login, and protected routes
- User, vendor, and admin roles
- Location discovery and location management
- Join, leave, and track an active queue
- Vendor/admin queue controls, including calling the next customer
- Live queue position and status updates over Socket.IO
- Wait-time and crowd predictions
- Location analytics for vendors and administrators
- Request validation, security headers, CORS, and rate limiting
- Unit and integration tests backed by an in-memory MongoDB server

## Tech stack

### Frontend

- React 18
- React Router
- Vite
- Tailwind CSS
- Axios
- Socket.IO Client
- Recharts

### Backend

- Node.js 18+
- Express
- MongoDB with Mongoose
- JWT and bcrypt authentication
- Socket.IO
- Jest and Supertest

## Project structure

```text
NoQueue/
├── backend/
│   ├── scripts/              # Database seed script
│   ├── src/
│   │   ├── config/           # Environment and database configuration
│   │   ├── controllers/      # HTTP request handlers
│   │   ├── middleware/       # Auth, validation, roles, errors, rate limiting
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/           # REST API routes
│   │   ├── services/         # Business logic
│   │   └── sockets/          # Socket.IO authentication and events
│   └── tests/                # Unit and integration tests
├── frontend/
│   └── src/
│       ├── api/              # Axios API client
│       ├── components/       # Shared UI and route guards
│       ├── context/          # Authentication state
│       ├── hooks/            # Reusable React hooks
│       └── pages/            # Application pages
└── build-phase-1.js
```

## Prerequisites

- Node.js 18 or later
- npm
- MongoDB 6+ running locally or a MongoDB connection string

## Installation

Clone the repository and install dependencies for both applications:

```bash
git clone <repository-url>
cd NoQueue

cd backend
npm install

cd ../frontend
npm install
```

## Environment configuration

Create `backend/.env`:

```dotenv
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/noqueue
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_MAX=20
```

Create `frontend/.env` if the API is not running at the default address:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Do not commit either `.env` file. In production, use a strong randomly generated `JWT_SECRET`, a production MongoDB URI, and the public frontend origin for `CLIENT_URL`.

## Running locally

Start MongoDB, then run the backend and frontend in separate terminals.

### Backend

```bash
cd backend
npm run dev
```

The API and Socket.IO server listen on `http://localhost:5000` by default. The health endpoint is available at [http://localhost:5000/health](http://localhost:5000/health).

### Frontend

```bash
cd frontend
npm run dev
```

The Vite development server listens on `http://localhost:5173` by default.

For a production frontend build:

```bash
cd frontend
npm run build
npm run preview
```

## Seed data

The seed script clears the configured database before creating sample users, locations, historical queue records, and active queues. Run it only against a development or intentionally disposable database:

```bash
cd backend
npm run seed
```

Seeded accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@noqueue.com` | `adminPassword123` |
| User | `customer1@noqueue.com` | `userPassword123` |

The seed script creates four sample locations and ten customer accounts. Change or remove seeded credentials before using a deployed environment.

## Authentication and roles

Successful registration and login return a JWT. Send it with protected API requests:

```http
Authorization: Bearer <token>
```

| Role | Capabilities |
| --- | --- |
| User | Browse locations, join/leave queues, view active queue status and history |
| Vendor | Create and manage owned locations, manage their queues, view analytics |
| Admin | Manage locations and queues across the application, view analytics |

Self-registration accepts `user` or `vendor`. Admin accounts should be created through a controlled administrative process such as the seed script.

## REST API

The API base path is `/api`.

### Authentication

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create a user or vendor account |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/api/auth/me` | Authenticated | Return the current user |

### Locations

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/locations` | Public | List locations |
| `GET` | `/api/locations/:id` | Public | Get one location |
| `POST` | `/api/locations` | Vendor/Admin | Create a location |
| `PUT` | `/api/locations/:id` | Owner/Admin | Update a location |
| `DELETE` | `/api/locations/:id` | Owner/Admin | Delete a location |

### Queues

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/queues/:locationId/join` | Authenticated | Join a location queue |
| `DELETE` | `/api/queues/:locationId/leave` | Authenticated | Leave a location queue |
| `GET` | `/api/queues/my/active` | Authenticated | Get the current user's active entries |
| `GET` | `/api/queues/my/history` | Authenticated | Get the current user's queue history |
| `GET` | `/api/queues/:locationId` | Vendor/Admin | View a location's live queue |
| `POST` | `/api/queues/:locationId/call-next` | Owner/Admin | Call the next customer |
| `PATCH` | `/api/queues/entry/:entryId/status` | Owner/Admin | Set an entry to `served`, `no_show`, or `cancelled` |

### Predictions and analytics

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/api/predictions/:locationId/wait` | Public | Get an estimated wait time |
| `GET` | `/api/predictions/:locationId/crowd` | Public | Get a crowd prediction |
| `GET` | `/api/analytics/:locationId` | Owner/Admin | Get location analytics |

All `:id` parameters must be valid MongoDB ObjectIds. Requests with invalid input return validation errors.

## Real-time queue updates

The backend exposes Socket.IO on the same origin and port as the API. The client must provide a JWT during the handshake:

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token },
});
```

Relevant client events:

- `queue:join` with `{ locationId }` joins a location room.
- `queue:leave` with `{ locationId }` leaves a location room.
- `queue:updated` broadcasts queue length, estimated wait time, status, and the currently served token.
- `position:update` sends the authenticated user's current position when joining a room.
- `user:position:<userId>` reports a user's updated position and estimated wait.
- `user:called:<userId>` notifies a user that they have been called.

## Testing and linting

From `backend/`:

```bash
npm test
npm run test:watch
npm run test:coverage
npm run lint
```

The test suite uses `mongodb-memory-server` and sets `NODE_ENV=test`, so it does not require a running external MongoDB instance.

## Security notes

- Keep JWT secrets and database credentials outside source control.
- Use HTTPS and secure production deployment configuration.
- Restrict `CLIENT_URL` to trusted frontend origins.
- Do not run `npm run seed` against a production database.
- Rotate the seeded or development credentials before deployment.
