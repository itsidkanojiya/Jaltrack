import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { query } from './pool.js';

const USERS = [
  {
    email: 'admin@jaltrack.com',
    password: 'admin123',
    fullName: 'Rajesh Kumar',
    role: 'admin',
    phone: '9876543210',
  },
  {
    email: 'superadmin@jaltrack.com',
    password: 'super123',
    fullName: 'Vikram Singh',
    role: 'super_admin',
    phone: '9876543211',
  },
  {
    email: 'delivery@jaltrack.com',
    password: 'delivery123',
    fullName: 'Ravi Kumar',
    role: 'delivery_boy',
    phone: '9876543212',
  },
  {
    email: 'client@jaltrack.com',
    password: 'client123',
    fullName: 'Sharma Sweets Pvt Ltd',
    role: 'client',
    phone: '9876543213',
    customerId: 1,
  },
];

async function seed() {
  console.log('Seeding users...\n');

  for (const u of USERS) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (existing.rows.length > 0) {
      console.log(`  SKIP  ${u.email} (already exists)`);
      continue;
    }

    const hash = await bcrypt.hash(u.password, 10);
    await query(
      'INSERT INTO users (email, password_hash, full_name, role, phone, customer_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [u.email, hash, u.fullName, u.role, u.phone, u.customerId || null]
    );
    console.log(`  OK    ${u.email} (${u.role})`);
  }

  console.log('\n--- Default Login Credentials ---\n');
  console.log('  ADMIN');
  console.log('    URL:      /admin/login');
  console.log('    Email:    admin@jaltrack.com');
  console.log('    Password: admin123\n');
  console.log('  SUPER ADMIN');
  console.log('    URL:      /super-admin/login');
  console.log('    Email:    superadmin@jaltrack.com');
  console.log('    Password: super123\n');
  console.log('  DELIVERY BOY');
  console.log('    URL:      /delivery/login');
  console.log('    Email:    delivery@jaltrack.com');
  console.log('    Password: delivery123\n');
  console.log('  CLIENT');
  console.log('    URL:      /client/login');
  console.log('    Email:    client@jaltrack.com');
  console.log('    Password: client123\n');
  console.log('---------------------------------');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
