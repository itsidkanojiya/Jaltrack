import { Router } from 'express';
import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
  getRouteSummary,
} from '../db/queries.js';

const router = Router();

function supplierId(req) {
  return req.tenant?.businessId ?? null;
}

router.get('/', async (req, res) => {
  try {
    const filters = {
      date: req.query.date || null,
      deliveryBoyId: req.query.deliveryBoyId ? parseInt(req.query.deliveryBoyId, 10) : null,
      status: req.query.status || null,
    };
    const list = await getRoutes(filters, supplierId(req));
    res.json(list);
  } catch (e) {
    console.error('routes list error:', e);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
});

router.get('/:id/summary', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid route id' });
    const summary = await getRouteSummary(id, supplierId(req));
    if (!summary) return res.status(404).json({ error: 'Route not found' });
    res.json(summary);
  } catch (e) {
    console.error('route summary error:', e);
    res.status(500).json({ error: 'Failed to fetch route summary' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid route id' });
    const route = await getRouteById(id, supplierId(req));
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (e) {
    console.error('route get error:', e);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createRoute(req.body, supplierId(req));
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create route' });
  } catch (e) {
    console.error('route create error:', e);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid route id' });
    const updated = await updateRoute(id, req.body, supplierId(req));
    if (!updated) return res.status(404).json({ error: 'Route not found or not editable (only draft can be updated)' });
    res.json(updated);
  } catch (e) {
    console.error('route update error:', e);
    res.status(500).json({ error: 'Failed to update route' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid route id' });
    const deleted = await deleteRoute(id, supplierId(req));
    if (!deleted) return res.status(404).json({ error: 'Route not found or not deletable (only draft can be deleted)' });
    res.status(204).send();
  } catch (e) {
    console.error('route delete error:', e);
    res.status(500).json({ error: 'Failed to delete route' });
  }
});

export default router;
