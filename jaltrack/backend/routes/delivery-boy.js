import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import {
  getDeliveryBoyToday,
  confirmDeliveryByBoy,
  createSpotSupplyByBoy,
  getDeliveryBoyHistory,
  getDeliveryBoyRouteToday,
  getRouteById,
  confirmRouteStop,
} from '../db/queries.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('delivery_boy'));

router.get('/today', async (req, res) => {
  try {
    const result = await getDeliveryBoyToday(req.user.id);
    res.json(result);
  } catch (e) {
    console.error('delivery-boy/today error:', e);
    res.status(500).json({ error: 'Failed to fetch today\'s deliveries' });
  }
});

router.post('/confirm-delivery', async (req, res) => {
  try {
    const result = await confirmDeliveryByBoy(req.user.id, req.body);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error, reason: result.reason, holidayDate: result.holidayDate });
    }
    res.json(result);
  } catch (e) {
    console.error('delivery-boy/confirm error:', e);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

router.post('/spot-supply', async (req, res) => {
  try {
    const result = await createSpotSupplyByBoy(req.user.id, req.body);
    if (result.error) {
      return res.status(result.status || 400).json({ error: result.error });
    }
    res.status(201).json(result);
  } catch (e) {
    console.error('delivery-boy/spot-supply error:', e);
    res.status(500).json({ error: 'Failed to save spot supply' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const range = req.query.range || 'today';
    const result = await getDeliveryBoyHistory(req.user.id, range);
    res.json(result);
  } catch (e) {
    console.error('delivery-boy/history error:', e);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── Route (planned delivery) ────────────────────────────────────
router.get('/routes/today', async (req, res) => {
  try {
    const route = await getDeliveryBoyRouteToday(req.user.id);
    res.json(route || { route: null, message: 'No route assigned for today' });
  } catch (e) {
    console.error('delivery-boy/routes/today error:', e);
    res.status(500).json({ error: 'Failed to fetch today\'s route' });
  }
});

router.get('/routes/:routeId', async (req, res) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    if (isNaN(routeId)) return res.status(400).json({ error: 'Invalid route id' });
    const route = await getRouteById(routeId, req.user?.businessId ?? null);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    if (Number(route.deliveryBoyId) !== Number(req.user.id)) return res.status(403).json({ error: 'Route not assigned to you' });
    res.json(route);
  } catch (e) {
    console.error('delivery-boy/routes/:id error:', e);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
});

router.post('/routes/:routeId/stops/:stopId/confirm', async (req, res) => {
  try {
    const routeId = parseInt(req.params.routeId, 10);
    const stopId = parseInt(req.params.stopId, 10);
    if (isNaN(routeId) || isNaN(stopId)) return res.status(400).json({ error: 'Invalid route or stop id' });
    const result = await confirmRouteStop(req.user.id, routeId, stopId, req.body);
    if (result.error) return res.status(result.status || 400).json({ error: result.error });
    res.json(result);
  } catch (e) {
    console.error('delivery-boy/confirm route stop error:', e);
    res.status(500).json({ error: 'Failed to confirm stop' });
  }
});

export default router;
