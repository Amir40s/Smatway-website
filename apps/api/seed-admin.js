const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Error: DATABASE_URL is not defined in the environment variables.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@smatway.com',
        name: 'Super Admin',
        passwordHash: hash,
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    console.log('✅ Admin user added successfully!');
    console.log('📧 Email: admin@smatway.com');
    console.log('🔑 Password: admin123');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}
run();
