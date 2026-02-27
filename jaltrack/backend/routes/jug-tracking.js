import { Router } from 'express';
import { getJugTracking } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getJugTracking(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch jug tracking data' });
  }
});

export default router;
