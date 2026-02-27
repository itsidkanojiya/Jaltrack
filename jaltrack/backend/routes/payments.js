import { Router } from 'express';
import { getPaymentsList, markPaymentReceived, markPaymentPromised } from '../db/queries.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json(await getPaymentsList(req.tenant?.businessId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.put('/:customerId/received', async (req, res) => {
  try {
    const result = await markPaymentReceived(parseInt(req.params.customerId, 10), req.body, req.tenant?.businessId);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

router.put('/:customerId/promised', async (req, res) => {
  try {
    const result = await markPaymentPromised(parseInt(req.params.customerId, 10), req.body, req.tenant?.businessId);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record promise' });
  }
});

export default router;
