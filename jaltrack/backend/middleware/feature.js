import { query } from '../db/pool.js';

const planCache = new Map();
const CACHE_TTL = 60_000;

async function getPlan(planId) {
  const cached = planCache.get(planId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const { rows } = await query('SELECT * FROM subscription_plans WHERE id = ?', [planId]);
  const plan = rows[0] || null;
  if (plan) planCache.set(planId, { data: plan, ts: Date.now() });
  return plan;
}

export function featureMiddleware(featureName) {
  return async (req, res, next) => {
    if (!req.tenant) return next();

    try {
      const plan = await getPlan(req.tenant.planId);
      if (!plan) return next();

      if (plan[featureName] !== undefined && !plan[featureName]) {
        return res.status(403).json({ error: 'Feature not available in current plan. Upgrade to access this module.' });
      }

      next();
    } catch (err) {
      console.error('Feature middleware error:', err);
      next();
    }
  };
}

export async function checkLimit(req, limitType) {
  if (!req.tenant) return { allowed: true };

  try {
    const plan = await getPlan(req.tenant.planId);
    if (!plan) return { allowed: true };

    const supplierId = req.tenant.businessId;

    if (limitType === 'max_customers') {
      const { rows } = await query('SELECT COUNT(*) AS cnt FROM customers WHERE supplier_id = ? AND active = 1', [supplierId]);
      const count = Number(rows[0]?.cnt || 0);
      if (count >= plan.max_customers) {
        return { allowed: false, error: `Plan limit reached (${plan.max_customers} customers). Upgrade your plan.` };
      }
    }

    if (limitType === 'max_delivery_boys') {
      const { rows } = await query("SELECT COUNT(*) AS cnt FROM users WHERE business_id = ? AND role = 'delivery_boy'", [supplierId]);
      const count = Number(rows[0]?.cnt || 0);
      if (count >= plan.max_delivery_boys) {
        return { allowed: false, error: `Plan limit reached (${plan.max_delivery_boys} delivery boys). Upgrade your plan.` };
      }
    }

    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}
