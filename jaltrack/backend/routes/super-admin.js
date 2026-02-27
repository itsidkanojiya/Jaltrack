import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import { query } from '../db/pool.js';
import { logAction } from '../middleware/audit.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('super_admin'));

// ─── Dashboard ─────────────────────────────────────────────────

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [bizRes, custRes, dbRes, revRes] = await Promise.all([
      query(`SELECT
        COUNT(*) AS total,
        SUM(status = 'active') AS active,
        SUM(status = 'suspended') AS suspended,
        SUM(status = 'trial') AS trial
        FROM businesses`),
      query('SELECT COUNT(*) AS cnt FROM customers WHERE active = 1'),
      query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'delivery_boy'"),
      query(`SELECT COALESCE(SUM(sp.price_monthly), 0) AS revenue
        FROM businesses b JOIN subscription_plans sp ON sp.id = b.plan_id
        WHERE b.status = 'active'`),
    ]);

    const biz = bizRes.rows[0];
    res.json({
      totalBusinesses: Number(biz?.total || 0),
      activeBusinesses: Number(biz?.active || 0),
      suspendedBusinesses: Number(biz?.suspended || 0),
      trialBusinesses: Number(biz?.trial || 0),
      totalCustomers: Number(custRes.rows[0]?.cnt || 0),
      totalDeliveryBoys: Number(dbRes.rows[0]?.cnt || 0),
      monthlySaasRevenue: Number(revRes.rows[0]?.revenue || 0),
    });
  } catch (e) {
    console.error('SA dashboard error:', e);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/dashboard/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const { rows } = await query(
      `SELECT al.id, al.action, al.detail, al.user_role, al.ip_address,
         al.created_at, u.full_name AS user_name, b.name AS business_name
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       LEFT JOIN businesses b ON b.id = al.business_id
       ORDER BY al.created_at DESC LIMIT ?`,
      [limit]
    );
    res.json(rows.map((r) => ({
      id: r.id,
      action: r.action,
      detail: r.detail,
      role: r.user_role,
      user: r.user_name || '—',
      business: r.business_name || '—',
      ip: r.ip_address,
      time: r.created_at,
    })));
  } catch (e) {
    console.error('SA activity error:', e);
    res.status(500).json({ error: 'Failed to load activity' });
  }
});

// ─── Businesses ────────────────────────────────────────────────

router.get('/businesses', async (req, res) => {
  try {
    const { status, plan_id, city, search } = req.query;
    let sql = `SELECT b.*, sp.name AS plan_name,
      (SELECT COUNT(*) FROM customers c WHERE c.supplier_id = b.id AND c.active = 1) AS customer_count,
      (SELECT COUNT(*) FROM users u WHERE u.business_id = b.id AND u.role = 'delivery_boy') AS delivery_boy_count
      FROM businesses b LEFT JOIN subscription_plans sp ON sp.id = b.plan_id WHERE 1=1`;
    const params = [];

    if (status) { sql += ' AND b.status = ?'; params.push(status); }
    if (plan_id) { sql += ' AND b.plan_id = ?'; params.push(plan_id); }
    if (city) { sql += ' AND b.city = ?'; params.push(city); }
    if (search) { sql += ' AND (b.name LIKE ? OR b.owner_name LIKE ? OR b.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY b.created_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('SA businesses error:', e);
    res.status(500).json({ error: 'Failed to load businesses' });
  }
});

router.get('/businesses/:id', async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.*, sp.name AS plan_name,
        (SELECT COUNT(*) FROM customers c WHERE c.supplier_id = b.id AND c.active = 1) AS customer_count,
        (SELECT COUNT(*) FROM users u WHERE u.business_id = b.id AND u.role = 'delivery_boy') AS delivery_boy_count,
        (SELECT COUNT(*) FROM users u WHERE u.business_id = b.id) AS total_users
       FROM businesses b LEFT JOIN subscription_plans sp ON sp.id = b.plan_id
       WHERE b.id = ?`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Business not found' });
    res.json(rows[0]);
  } catch (e) {
    console.error('SA business detail error:', e);
    res.status(500).json({ error: 'Failed to load business' });
  }
});

router.post('/businesses', async (req, res) => {
  try {
    const { name, ownerName, email, phone, city, address, planId } = req.body;
    if (!name) return res.status(400).json({ error: 'Business name is required' });

    await query(
      `INSERT INTO businesses (name, owner_name, email, phone, city, address, plan_id, status, subscription_start, subscription_expiry, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'trial', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'pending')`,
      [name, ownerName || '', email || '', phone || '', city || '', address || '', planId || 1]
    );

    const { rows } = await query('SELECT * FROM businesses WHERE id = LAST_INSERT_ID()');
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    logAction(req.user.id, 'super_admin', rows[0]?.id, 'business_created', `Created business: ${name}`, ip);
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('SA create business error:', e);
    res.status(500).json({ error: 'Failed to create business' });
  }
});

router.put('/businesses/:id', async (req, res) => {
  try {
    const { name, ownerName, email, phone, city, address } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (ownerName !== undefined) { fields.push('owner_name = ?'); params.push(ownerName); }
    if (email !== undefined) { fields.push('email = ?'); params.push(email); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (city !== undefined) { fields.push('city = ?'); params.push(city); }
    if (address !== undefined) { fields.push('address = ?'); params.push(address); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await query(`UPDATE businesses SET ${fields.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM businesses WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('SA update business error:', e);
    res.status(500).json({ error: 'Failed to update business' });
  }
});

router.put('/businesses/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'trial'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await query('UPDATE businesses SET status = ? WHERE id = ?', [status, req.params.id]);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    logAction(req.user.id, 'super_admin', Number(req.params.id), 'business_status_change', `Status → ${status}`, ip);
    const { rows } = await query('SELECT * FROM businesses WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('SA status change error:', e);
    res.status(500).json({ error: 'Failed to change status' });
  }
});

router.put('/businesses/:id/subscription', async (req, res) => {
  try {
    const { planId, expiryDate, paymentStatus } = req.body;
    const fields = [];
    const params = [];
    if (planId !== undefined) { fields.push('plan_id = ?'); params.push(planId); }
    if (expiryDate !== undefined) { fields.push('subscription_expiry = ?'); params.push(expiryDate); }
    if (paymentStatus !== undefined) { fields.push('payment_status = ?'); params.push(paymentStatus); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });

    params.push(req.params.id);
    await query(`UPDATE businesses SET ${fields.join(', ')} WHERE id = ?`, params);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    logAction(req.user.id, 'super_admin', Number(req.params.id), 'subscription_updated', JSON.stringify(req.body), ip);
    const { rows } = await query(
      'SELECT b.*, sp.name AS plan_name FROM businesses b LEFT JOIN subscription_plans sp ON sp.id = b.plan_id WHERE b.id = ?',
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('SA subscription error:', e);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ─── Plans ─────────────────────────────────────────────────────

router.get('/plans', async (_req, res) => {
  try {
    const { rows } = await query('SELECT * FROM subscription_plans ORDER BY price_monthly ASC');
    res.json(rows);
  } catch (e) {
    console.error('SA plans error:', e);
    res.status(500).json({ error: 'Failed to load plans' });
  }
});

router.post('/plans', async (req, res) => {
  try {
    const { name, priceMonthly, maxCustomers, maxDeliveryBoys, featureExpenses, featureEvents, featureJugTracking, featureSpotSupply, featureClientPortal } = req.body;
    await query(
      `INSERT INTO subscription_plans (name, price_monthly, max_customers, max_delivery_boys, feature_expenses, feature_events, feature_jug_tracking, feature_spot_supply, feature_client_portal)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, priceMonthly || 0, maxCustomers || 50, maxDeliveryBoys || 1,
        featureExpenses ?? true, featureEvents ?? true, featureJugTracking ?? true, featureSpotSupply ?? true, featureClientPortal ?? true]
    );
    const { rows } = await query('SELECT * FROM subscription_plans WHERE id = LAST_INSERT_ID()');
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('SA create plan error:', e);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

router.put('/plans/:id', async (req, res) => {
  try {
    const { name, priceMonthly, maxCustomers, maxDeliveryBoys, featureExpenses, featureEvents, featureJugTracking, featureSpotSupply, featureClientPortal } = req.body;
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (priceMonthly !== undefined) { fields.push('price_monthly = ?'); params.push(priceMonthly); }
    if (maxCustomers !== undefined) { fields.push('max_customers = ?'); params.push(maxCustomers); }
    if (maxDeliveryBoys !== undefined) { fields.push('max_delivery_boys = ?'); params.push(maxDeliveryBoys); }
    if (featureExpenses !== undefined) { fields.push('feature_expenses = ?'); params.push(featureExpenses); }
    if (featureEvents !== undefined) { fields.push('feature_events = ?'); params.push(featureEvents); }
    if (featureJugTracking !== undefined) { fields.push('feature_jug_tracking = ?'); params.push(featureJugTracking); }
    if (featureSpotSupply !== undefined) { fields.push('feature_spot_supply = ?'); params.push(featureSpotSupply); }
    if (featureClientPortal !== undefined) { fields.push('feature_client_portal = ?'); params.push(featureClientPortal); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });

    params.push(req.params.id);
    await query(`UPDATE subscription_plans SET ${fields.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM subscription_plans WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('SA update plan error:', e);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ─── Users ─────────────────────────────────────────────────────

router.get('/users', async (req, res) => {
  try {
    const { role, business_id, search } = req.query;
    let sql = `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.business_id,
      b.name AS business_name, u.created_at
      FROM users u LEFT JOIN businesses b ON b.id = u.business_id WHERE 1=1`;
    const params = [];
    if (role) { sql += ' AND u.role = ?'; params.push(role); }
    if (business_id) { sql += ' AND u.business_id = ?'; params.push(business_id); }
    if (search) { sql += ' AND (u.full_name LIKE ? OR u.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    sql += ' ORDER BY u.created_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('SA users error:', e);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.put('/users/:id/disable', async (req, res) => {
  try {
    const { disabled } = req.body;
    await query('UPDATE users SET role = ? WHERE id = ?', [disabled ? 'disabled' : req.body.restoreRole || 'admin', req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error('SA disable user error:', e);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const tempPassword = 'Jaltrack@123';
    const hash = await bcrypt.hash(tempPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '';
    logAction(req.user.id, 'super_admin', null, 'password_reset', `Reset password for user ${req.params.id}`, ip);
    res.json({ success: true, tempPassword });
  } catch (e) {
    console.error('SA reset password error:', e);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── Leads (CRM) ──────────────────────────────────────────────

router.get('/leads', async (req, res) => {
  try {
    const { status, city } = req.query;
    let sql = 'SELECT * FROM leads WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (city) { sql += ' AND city = ?'; params.push(city); }
    sql += ' ORDER BY created_at DESC';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('SA leads error:', e);
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

router.post('/leads', async (req, res) => {
  try {
    const { businessName, contactPerson, phone, email, city, notes, followUpDate } = req.body;
    if (!businessName) return res.status(400).json({ error: 'Business name is required' });
    await query(
      'INSERT INTO leads (business_name, contact_person, phone, email, city, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [businessName, contactPerson || '', phone || '', email || '', city || '', notes || '', followUpDate || null]
    );
    const { rows } = await query('SELECT * FROM leads WHERE id = LAST_INSERT_ID()');
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('SA create lead error:', e);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.put('/leads/:id', async (req, res) => {
  try {
    const { status, notes, followUpDate, contactPerson, phone, city } = req.body;
    const fields = [];
    const params = [];
    if (status !== undefined) { fields.push('status = ?'); params.push(status); }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }
    if (followUpDate !== undefined) { fields.push('follow_up_date = ?'); params.push(followUpDate || null); }
    if (contactPerson !== undefined) { fields.push('contact_person = ?'); params.push(contactPerson); }
    if (phone !== undefined) { fields.push('phone = ?'); params.push(phone); }
    if (city !== undefined) { fields.push('city = ?'); params.push(city); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });

    params.push(req.params.id);
    await query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    console.error('SA update lead error:', e);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

router.delete('/leads/:id', async (req, res) => {
  try {
    await query('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    console.error('SA delete lead error:', e);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

router.post('/leads/:id/convert', async (req, res) => {
  try {
    const leadRes = await query('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    const lead = leadRes.rows[0];
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const { planId, adminEmail, adminPassword } = req.body;

    await query(
      `INSERT INTO businesses (name, owner_name, email, phone, city, plan_id, status, subscription_start, subscription_expiry, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'active', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'pending')`,
      [lead.business_name, lead.contact_person, lead.email, lead.phone, lead.city, planId || 1]
    );
    const bizRes = await query('SELECT id FROM businesses WHERE id = LAST_INSERT_ID()');
    const newBusinessId = bizRes.rows[0].id;

    if (adminEmail && adminPassword) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await query(
        'INSERT INTO users (email, password_hash, full_name, role, phone, business_id) VALUES (?, ?, ?, ?, ?, ?)',
        [adminEmail, hash, lead.contact_person || lead.business_name, 'admin', lead.phone || '', newBusinessId]
      );
    }

    await query('UPDATE leads SET status = ?, converted_business_id = ? WHERE id = ?', ['converted', newBusinessId, lead.id]);

    res.json({ success: true, businessId: newBusinessId });
  } catch (e) {
    console.error('SA convert lead error:', e);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// ─── Analytics ─────────────────────────────────────────────────

router.get('/analytics/top-businesses', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT b.id, b.name, b.city,
        (SELECT COUNT(*) FROM customers c WHERE c.supplier_id = b.id AND c.active = 1) AS customers,
        (SELECT COALESCE(SUM(COALESCE(i.final_amount, i.total_amount)), 0) FROM invoices i WHERE i.supplier_id = b.id) AS billing_volume
       FROM businesses b WHERE b.status != 'suspended'
       ORDER BY customers DESC LIMIT 10`
    );
    res.json(rows);
  } catch (e) {
    console.error('SA analytics error:', e);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

router.get('/analytics/growth', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM businesses GROUP BY month ORDER BY month DESC LIMIT 12`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load growth data' });
  }
});

router.get('/analytics/churn', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, city, subscription_expiry, status
       FROM businesses
       WHERE subscription_expiry <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       ORDER BY subscription_expiry ASC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load churn data' });
  }
});

router.get('/analytics/revenue', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT sp.name AS plan, sp.price_monthly, COUNT(b.id) AS businesses,
        COUNT(b.id) * sp.price_monthly AS total_revenue
       FROM subscription_plans sp
       LEFT JOIN businesses b ON b.plan_id = sp.id AND b.status = 'active'
       GROUP BY sp.id ORDER BY total_revenue DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load revenue data' });
  }
});

// ─── Announcements ─────────────────────────────────────────────

router.get('/announcements', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.*, b.name AS business_name
       FROM announcements a LEFT JOIN businesses b ON b.id = a.business_id
       ORDER BY a.created_at DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, message, target, businessId } = req.body;
    if (!title || !message) return res.status(400).json({ error: 'Title and message required' });
    await query(
      'INSERT INTO announcements (title, message, target, business_id, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, message, target || 'all', businessId || null, req.user.id]
    );
    const { rows } = await query('SELECT * FROM announcements WHERE id = LAST_INSERT_ID()');
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  try {
    const { title, message, isActive } = req.body;
    const fields = [];
    const params = [];
    if (title !== undefined) { fields.push('title = ?'); params.push(title); }
    if (message !== undefined) { fields.push('message = ?'); params.push(message); }
    if (isActive !== undefined) { fields.push('is_active = ?'); params.push(isActive); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
    params.push(req.params.id);
    await query(`UPDATE announcements SET ${fields.join(', ')} WHERE id = ?`, params);
    const { rows } = await query('SELECT * FROM announcements WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

// ─── Audit Logs ────────────────────────────────────────────────

router.get('/logs', async (req, res) => {
  try {
    const { user_id, role, action, business_id, from, to } = req.query;
    const limit = parseInt(req.query.limit, 10) || 50;
    let sql = `SELECT al.*, u.full_name AS user_name, b.name AS business_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      LEFT JOIN businesses b ON b.id = al.business_id WHERE 1=1`;
    const params = [];
    if (user_id) { sql += ' AND al.user_id = ?'; params.push(user_id); }
    if (role) { sql += ' AND al.user_role = ?'; params.push(role); }
    if (action) { sql += ' AND al.action LIKE ?'; params.push(`%${action}%`); }
    if (business_id) { sql += ' AND al.business_id = ?'; params.push(business_id); }
    if (from) { sql += ' AND al.created_at >= ?'; params.push(from); }
    if (to) { sql += ' AND al.created_at <= ?'; params.push(to); }
    sql += ' ORDER BY al.created_at DESC LIMIT ?';
    params.push(limit);
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('SA logs error:', e);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

export default router;
