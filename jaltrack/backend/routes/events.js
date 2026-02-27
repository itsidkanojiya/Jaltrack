import { Router } from 'express';
import { getEvents, createEvent, getEventDetail, updateEvent } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getEvents(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

router.post('/', async (req, res) => {
  try {
    const created = await createEvent(req.body, req.tenant?.businessId);
    if (created) return res.status(201).json(created);
    res.status(400).json({ error: 'Failed to create event' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const detail = await getEventDetail(parseInt(req.params.id, 10), req.tenant?.businessId);
    if (detail) return res.json(detail);
    res.status(404).json({ error: 'Event not found' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch event detail' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await updateEvent(parseInt(req.params.id, 10), req.body, req.tenant?.businessId);
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

export default router;
