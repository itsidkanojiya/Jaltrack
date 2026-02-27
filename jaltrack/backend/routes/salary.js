import { Router } from 'express';
import { getSalaries, getSalaryById, getSalaryMonthSummary, createSalary, updateSalary, deleteSalary, getDeliveryBoys } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const list = await getSalaries(month, year, req.tenant?.businessId);
    const summary = (month != null && year != null) ? await getSalaryMonthSummary(month, year, req.tenant?.businessId) : null;
    if (summary != null) {
      return res.json({ salaries: list, summary });
    }
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch salaries' });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const month = req.query.month ? parseInt(req.query.month, 10) : undefined;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    const summary = await getSalaryMonthSummary(month, year, req.tenant?.businessId);
    res.json(summary);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch salary summary' });
  }
});

router.get('/delivery-boys', async (req, res) => {
  try {
    res.json(await getDeliveryBoys(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch delivery boys' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const row = await getSalaryById(id, req.tenant?.businessId);
    if (!row) return res.status(404).json({ error: 'Salary record not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch salary record' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createSalary(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create salary record' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create salary record' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const updated = await updateSalary(id, req.body, req.tenant?.businessId);
    if (!updated) return res.status(404).json({ error: 'Salary record not found' });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update salary record' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const deleted = await deleteSalary(id, req.tenant?.businessId);
    if (!deleted) return res.status(404).json({ error: 'Salary record not found' });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete salary record' });
  }
});

export default router;
