import { Router } from 'express';
import { getSupplierHolidays, createSupplierHoliday, deleteSupplierHoliday } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getSupplierHolidays(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createSupplierHoliday(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create holiday' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteSupplierHoliday(parseInt(req.params.id, 10), req.tenant?.businessId);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

export default router;
