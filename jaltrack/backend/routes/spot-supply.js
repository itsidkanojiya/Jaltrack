import { Router } from 'express';
import { getSpotSupplyList, createSpotSupply } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getSpotSupplyList(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch spot supply list' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createSpotSupply(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create spot supply' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create spot supply' });
  }
});

export default router;
