import { query } from '../db/pool.js';

export function tenantMiddleware(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  if (req.user.role === 'super_admin') {
    req.tenant = null;
    return next();
  }

  const businessId = req.user.businessId;
  if (!businessId) {
    return res.status(403).json({ error: 'No business linked to this account' });
  }

  query('SELECT id, status, subscription_expiry, plan_id, name FROM businesses WHERE id = ?', [businessId])
    .then(({ rows }) => {
      const biz = rows[0];
      if (!biz) return res.status(403).json({ error: 'Business not found' });

      if (biz.status === 'suspended') {
        return res.status(403).json({ error: 'Subscription expired. Contact support.' });
      }

      if (biz.subscription_expiry && new Date(biz.subscription_expiry) < new Date()) {
        query('UPDATE businesses SET status = ? WHERE id = ?', ['suspended', businessId]).catch(() => {});
        return res.status(403).json({ error: 'Subscription expired. Contact support.' });
      }

      req.tenant = {
        businessId: biz.id,
        businessName: biz.name,
        planId: biz.plan_id,
        status: biz.status,
      };
      next();
    })
    .catch((err) => {
      console.error('Tenant middleware error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
}

export function getSupplierId(req) {
  return req.tenant?.businessId || null;
}
