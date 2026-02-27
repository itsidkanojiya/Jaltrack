import { Router } from 'express';
import { getProfitSummary } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    res.json(await getProfitSummary(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      req.tenant?.businessId
    ));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch profit summary' });
  }
});

export default router;
