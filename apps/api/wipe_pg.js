const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://smatway:smatway@localhost:5435/smatway?schema=public'
});

async function run() {
  await pool.query('DELETE FROM "CharterService";');
  console.log('Test charter services deleted via PG.');
  await pool.end();
}

run().catch(console.error);
