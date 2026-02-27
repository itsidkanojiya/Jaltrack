import { Router } from 'express';
import { getDeliveries, createDelivery } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    res.json(await getDeliveries(limit, req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createDelivery(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create delivery' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
});

export default router;
