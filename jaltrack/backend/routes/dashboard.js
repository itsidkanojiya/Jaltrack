import { Router } from 'express';
import { getDashboardStats, getDashboardActivity, getDashboardAnalytics } from '../db/queries.js';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    res.json(await getDashboardStats(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.get('/activity', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    res.json(await getDashboardActivity(limit, req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    res.json(await getDashboardAnalytics(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
