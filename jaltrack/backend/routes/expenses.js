import { Router } from 'express';
import { getExpenses, createExpense } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    res.json(await getExpenses(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      req.tenant?.businessId
    ));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createExpense(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create expense' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;
