import { Router } from 'express';
import { getInvoices, generateBilling, adjustInvoice, getInvoiceDetail } from '../db/queries.js';

const router = Router();

router.get('/invoices', async (req, res) => {
  try {
    const { month, year } = req.query;
    res.json(await getInvoices(
      month ? parseInt(month, 10) : undefined,
      year ? parseInt(year, 10) : undefined,
      req.tenant?.businessId
    ));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const month = parseInt(req.body.month, 10);
    const year = parseInt(req.body.year, 10);
    if (!month || !year) return res.status(400).json({ error: 'month and year required' });
    await generateBilling(month, year, req.tenant?.businessId);
    const invoices = await getInvoices(month, year, req.tenant?.businessId);
    res.json(invoices);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate billing' });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const detail = await getInvoiceDetail(parseInt(req.params.id, 10), req.tenant?.businessId);
    if (detail) return res.json(detail);
    res.status(404).json({ error: 'Invoice not found' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch invoice detail' });
  }
});

router.put('/invoices/:id/adjust', async (req, res) => {
  try {
    const updated = await adjustInvoice(parseInt(req.params.id, 10), req.body, req.tenant?.businessId);
    if (updated) return res.json(updated);
    res.status(404).json({ error: 'Invoice not found' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to adjust invoice' });
  }
});

export default router;
