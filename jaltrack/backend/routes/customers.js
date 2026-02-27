import { Router } from 'express';
import { getCustomers, createCustomer, updateCustomer } from '../db/queries.js';
import { checkLimit } from '../middleware/feature.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getCustomers(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.post('/', async (req, res) => {
  try {
    const limit = await checkLimit(req, 'max_customers');
    if (!limit.allowed) return res.status(403).json({ error: limit.error });
    const created = await createCustomer(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create customer' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateCustomer(parseInt(req.params.id, 10), req.body, req.tenant?.businessId);
    if (updated) return res.json(updated);
    res.status(404).json({ error: 'Customer not found' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

export default router;
