const mongoose = require('mongoose');
const env = require('../src/config/env');
const User = require('../src/models/User');
const Location = require('../src/models/Location');
const QueueEntry = require('../src/models/QueueEntry');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Location.deleteMany({}),
      QueueEntry.deleteMany({}),
    ]);

    console.log('[Seed] Seeding Users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@noqueue.com',
      password: 'adminPassword123',
      role: 'admin',
    });

    const sampleUsers = [];
    for (let i = 1; i <= 10; i++) {
      const user = await User.create({
        name: `Customer ${i}`,
        email: `customer${i}@noqueue.com`,
        password: 'userPassword123',
        role: 'user',
      });
      sampleUsers.push(user);
    }

    console.log('[Seed] Seeding Locations...');
    const locations = await Location.create([
      {
        name: 'Apollo Medical Center - Outpatient',
        address: '42 Healthway Road, Sector 5',
        description: 'Primary care triage, general physician consultations, and labs',
        category: 'hospital',
        status: 'open',
        avgServiceTime: 12,
        createdBy: admin._id,
      },
      {
        name: 'Apex Bank - Downtown Branch',
        address: '100 Financial Avenue, Suite 10',
        description: 'Teller services, personal accounts, cash deposit and withdrawal',
        category: 'bank',
        status: 'open',
        avgServiceTime: 8,
        createdBy: admin._id,
      },
      {
        name: 'Passport & Citizen Services Desk',
        address: 'Government Complex Building C',
        description: 'Biometric verification, passport renewal, and official certificates',
        category: 'government',
        status: 'open',
        avgServiceTime: 15,
        createdBy: admin._id,
      },
      {
        name: 'Bella Italia Bistro',
        address: '88 Culinary Square',
        description: 'Artisanal trattoria with high-traffic evening dinner queues',
        category: 'restaurant',
        status: 'open',
        avgServiceTime: 30,
        createdBy: admin._id,
      },
    ]);

    console.log('[Seed] Seeding Historical Data for Predictions...');
    const now = new Date();
    const historyEntries = [];

    locations.forEach((loc) => {
      for (let dayOffset = 1; dayOffset <= 20; dayOffset++) {
        for (let hour = 9; hour <= 17; hour += 2) {
          const entryDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
          entryDate.setHours(hour, Math.floor(Math.random() * 50), 0);

          const durationVariance = Math.floor(Math.random() * 6) - 3;
          const serviceDuration = Math.max(3, loc.avgServiceTime + durationVariance);

          const calledDate = new Date(entryDate.getTime() + serviceDuration * 60000);
          const servedDate = new Date(calledDate.getTime() + serviceDuration * 60000);

          const randomUser = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];

          historyEntries.push({
            user: randomUser._id,
            location: loc._id,
            status: 'served',
            tokenNumber: `${loc.category[0].toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            position: 0,
            joinedAt: entryDate,
            calledAt: calledDate,
            servedAt: servedDate,
            serviceDuration,
            hourOfDay: hour,
            dayOfWeek: entryDate.getDay(),
            queueLengthAtJoin: Math.floor(Math.random() * 8) + 1,
          });
        }
      }
    });

    await QueueEntry.insertMany(historyEntries);

    console.log('[Seed] Seeding Active Waiting Queues...');
    const apollo = locations[0];
    for (let i = 0; i < 4; i++) {
      await QueueEntry.create({
        user: sampleUsers[i]._id,
        location: apollo._id,
        status: 'waiting',
        position: i + 1,
        tokenNumber: `H-${100 + i}`,
        joinedAt: new Date(Date.now() - (4 - i) * 5 * 60000),
        hourOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        queueLengthAtJoin: i,
      });
    }

    console.log('\n================ SEED SUMMARY ================');
    console.log(`Admin User: admin@noqueue.com / adminPassword123`);
    console.log(`Test User : customer1@noqueue.com / userPassword123`);
    console.log(`Locations Created: ${locations.length}`);
    console.log(`Historical Training Records: ${historyEntries.length}`);
    console.log(`Live Waiting Users Seeded: 4`);
    console.log('==============================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();