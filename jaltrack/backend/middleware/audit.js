import { query } from '../db/pool.js';

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

function deriveAction(method, path) {
  const m = method.toUpperCase();
  const clean = path.replace(/\/\d+/g, '/:id').replace(/\?.*$/, '');
  return `${m} ${clean}`;
}

export function auditMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    if (!req.user) return;
    if (res.statusCode >= 500) return;

    const action = deriveAction(req.method, req.originalUrl || req.url);

    query(
      'INSERT INTO audit_logs (user_id, user_role, business_id, action, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        req.user.role,
        req.user.businessId || null,
        action,
        `${res.statusCode} (${Date.now() - start}ms)`,
        getClientIp(req),
      ]
    ).catch(() => {});
  });

  next();
}

export async function logAction(userId, role, businessId, action, detail, ip) {
  try {
    await query(
      'INSERT INTO audit_logs (user_id, user_role, business_id, action, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, role, businessId, action, detail || '', ip || '']
    );
  } catch {
    // non-critical
  }
}
