import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { logAction } from '../middleware/audit.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required' });
    }

    const identifier = email.trim();
    const isEmail = identifier.includes('@');

    const result = await query(
      isEmail
        ? 'SELECT id, email, username, password_hash, full_name, role, phone, customer_id, business_id FROM users WHERE email = ?'
        : 'SELECT id, email, username, password_hash, full_name, role, phone, customer_id, business_id FROM users WHERE username = ?',
      [identifier]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== 'super_admin' && user.business_id) {
      const bizRes = await query('SELECT id, status, subscription_expiry FROM businesses WHERE id = ?', [user.business_id]);
      const biz = bizRes.rows[0];
      if (biz) {
        if (biz.status === 'suspended') {
          return res.status(403).json({ error: 'Subscription expired. Contact support.' });
        }
        if (biz.subscription_expiry && new Date(biz.subscription_expiry) < new Date()) {
          await query('UPDATE businesses SET status = ? WHERE id = ?', ['suspended', biz.id]);
          return res.status(403).json({ error: 'Subscription expired. Contact support.' });
        }
      }
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    logAction(user.id, user.role, user.business_id, 'login', 'Successful login', ip);

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        username: user.username || null,
        role: user.role,
        phone: user.phone,
        customerId: user.customer_id || null,
        businessId: user.business_id || null,
      },
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName, role, phone, customerId, businessId, username } = req.body;
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ error: 'email, password, fullName, and role are required' });
    }

    const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    if (username) {
      const existingUsername = await query('SELECT id FROM users WHERE username = ?', [username]);
      if (existingUsername.rows.length > 0) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    const hash = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO users (email, username, password_hash, full_name, role, phone, customer_id, business_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [email, username || null, hash, fullName, role, phone || null, customerId || null, businessId || null]
    );

    const result = await query('SELECT id, email, username, full_name, role, phone, customer_id, business_id FROM users WHERE email = ?', [email]);
    const user = result.rows[0];

    const token = signToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        username: user.username || null,
        role: user.role,
        phone: user.phone,
        customerId: user.customer_id || null,
        businessId: user.business_id || null,
      },
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.get('/announcements/mine', async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.json({ announcements: [] });

    const jwt = await import('jsonwebtoken');
    const payload = jwt.default.verify(header.slice(7), process.env.JWT_SECRET || 'jaltrack_fallback_secret');
    const businessId = payload.businessId;
    if (!businessId) return res.json({ announcements: [] });

    const { rows } = await query(
      `SELECT id, title, message, created_at FROM announcements
       WHERE is_active = 1 AND (target = 'all' OR business_id = ?)
       ORDER BY created_at DESC LIMIT 10`,
      [businessId]
    );
    res.json({ announcements: rows });
  } catch {
    res.json({ announcements: [] });
  }
});

export default router;
