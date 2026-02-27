import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roleMiddleware } from '../middleware/role.js';
import {
  getClientDashboard,
  getClientBilling,
  getClientDeliveries,
  getClientInvoice,
  createClientIssue,
  getClientIssues,
} from '../db/queries.js';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('client'));

function cid(req, res) {
  const id = req.user.customerId;
  if (!id) {
    res.status(403).json({ error: 'No customer linked to this account' });
    return null;
  }
  return id;
}

router.get('/dashboard', async (req, res) => {
  try {
    const id = cid(req, res);
    if (!id) return;
    res.json(await getClientDashboard(id));
  } catch (e) {
    console.error('client/dashboard error:', e);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/billing', async (req, res) => {
  try {
    const id = cid(req, res);
    if (!id) return;
    const year = req.query.year ? parseInt(req.query.year, 10) : undefined;
    res.json(await getClientBilling(id, year));
  } catch (e) {
    console.error('client/billing error:', e);
    res.status(500).json({ error: 'Failed to load billing' });
  }
});

router.get('/deliveries', async (req, res) => {
  try {
    const id = cid(req, res);
    if (!id) return;
    const { range, from, to } = req.query;
    res.json(await getClientDeliveries(id, range, from, to));
  } catch (e) {
    console.error('client/deliveries error:', e);
    res.status(500).json({ error: 'Failed to load deliveries' });
  }
});

router.get('/invoice/:id', async (req, res) => {
  try {
    const customerId = cid(req, res);
    if (!customerId) return;
    const invoice = await getClientInvoice(customerId, parseInt(req.params.id, 10));
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (e) {
    console.error('client/invoice error:', e);
    res.status(500).json({ error: 'Failed to load invoice' });
  }
});

router.post('/issues', async (req, res) => {
  try {
    const id = cid(req, res);
    if (!id) return;
    const { subject, description } = req.body;
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    const issue = await createClientIssue(id, { subject, description });
    res.status(201).json({ success: true, issue });
  } catch (e) {
    console.error('client/issues POST error:', e);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

router.get('/issues', async (req, res) => {
  try {
    const id = cid(req, res);
    if (!id) return;
    const issues = await getClientIssues(id);
    res.json({ issues });
  } catch (e) {
    console.error('client/issues GET error:', e);
    res.status(500).json({ error: 'Failed to load issues' });
  }
});

export default router;
