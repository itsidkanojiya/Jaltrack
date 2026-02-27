import bcrypt from 'bcryptjs';

const users = [
  { email: 'admin@jaltrack.com', username: 'admin', password: 'admin123', name: 'Rajesh Kumar', role: 'admin', phone: '9876543210', businessId: 1 },
  { email: 'superadmin@jaltrack.com', username: 'superadmin', password: 'super123', name: 'Vikram Singh', role: 'super_admin', phone: '9876543211', businessId: null },
  { email: 'delivery@jaltrack.com', username: 'delivery', password: 'delivery123', name: 'Ravi Kumar', role: 'delivery_boy', phone: '9876543212', businessId: 1 },
  { email: 'client@jaltrack.com', username: 'client', password: 'client123', name: 'Sharma Sweets Pvt Ltd', role: 'client', phone: '9876543213', businessId: 1, customerId: 1 },
];

async function generate() {
  console.log('-- Jaltrack Seed: Default Users (with username + business_id + customer_id)');
  console.log('-- Paste this SQL into phpMyAdmin SQL tab\n');
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const custCol = u.customerId ? ', customer_id' : '';
    const custVal = u.customerId ? `, ${u.customerId}` : '';
    const bizVal = u.businessId ? u.businessId : 'NULL';
    console.log(`INSERT INTO users (email, username, password_hash, full_name, role, phone, business_id${custCol}) VALUES ('${u.email}', '${u.username}', '${hash}', '${u.name}', '${u.role}', '${u.phone}', ${bizVal}${custVal});`);
  }
  console.log('\n-- Fix existing users (run if users already exist):');
  console.log("UPDATE users SET business_id = 1 WHERE role IN ('admin', 'delivery_boy', 'client') AND business_id IS NULL;");
  console.log("UPDATE users SET customer_id = 1 WHERE email = 'client@jaltrack.com' AND customer_id IS NULL;");
  console.log("UPDATE users SET username = 'admin' WHERE email = 'admin@jaltrack.com' AND username IS NULL;");
  console.log("UPDATE users SET username = 'superadmin' WHERE email = 'superadmin@jaltrack.com' AND username IS NULL;");
  console.log("UPDATE users SET username = 'delivery' WHERE email = 'delivery@jaltrack.com' AND username IS NULL;");
  console.log("UPDATE users SET username = 'client' WHERE email = 'client@jaltrack.com' AND username IS NULL;");
  console.log('\n-- Credentials (login with email OR username):');
  console.log('-- admin@jaltrack.com   OR  admin      / admin123');
  console.log('-- superadmin@jaltrack.com OR superadmin / super123');
  console.log('-- delivery@jaltrack.com OR delivery    / delivery123');
  console.log('-- client@jaltrack.com  OR  client      / client123');
}

generate();
