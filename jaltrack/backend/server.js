import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testConnection } from './db/pool.js';

import { authMiddleware } from './middleware/auth.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { featureMiddleware } from './middleware/feature.js';
import { auditMiddleware } from './middleware/audit.js';

import authRoutes from './routes/auth.js';
import superAdminRoutes from './routes/super-admin.js';
import deliveryBoyRoutes from './routes/delivery-boy.js';
import clientRoutes from './routes/client.js';
import dashboardRoutes from './routes/dashboard.js';
import customerRoutes from './routes/customers.js';
import deliveryRoutes from './routes/deliveries.js';
import spotSupplyRoutes from './routes/spot-supply.js';
import eventRoutes from './routes/events.js';
import billingRoutes from './routes/billing.js';
import paymentRoutes from './routes/payments.js';
import expenseRoutes from './routes/expenses.js';
import salaryRoutes from './routes/salary.js';
import holidayRoutes from './routes/holidays.js';
import jugTrackingRoutes from './routes/jug-tracking.js';
import profitRoutes from './routes/profit.js';
import routesRoutes from './routes/routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Jaltrack API is running' });
});

// Public routes
app.use('/api/auth', authRoutes);

// Super Admin routes (own auth + role check inside)
app.use('/api/super-admin', superAdminRoutes);

// Delivery boy & Client routes (own auth + role check inside, add tenant)
app.use('/api/delivery-boy', deliveryBoyRoutes);
app.use('/api/client', clientRoutes);

// Admin operational routes — auth → audit → tenant → feature gating
app.use('/api/dashboard', authMiddleware, auditMiddleware, tenantMiddleware, dashboardRoutes);
app.use('/api/customers', authMiddleware, auditMiddleware, tenantMiddleware, customerRoutes);
app.use('/api/deliveries', authMiddleware, auditMiddleware, tenantMiddleware, deliveryRoutes);
app.use('/api/routes', authMiddleware, auditMiddleware, tenantMiddleware, routesRoutes);
app.use('/api/spot-supply', authMiddleware, auditMiddleware, tenantMiddleware, featureMiddleware('feature_spot_supply'), spotSupplyRoutes);
app.use('/api/events', authMiddleware, auditMiddleware, tenantMiddleware, featureMiddleware('feature_events'), eventRoutes);
app.use('/api/billing', authMiddleware, auditMiddleware, tenantMiddleware, billingRoutes);
app.use('/api/payments', authMiddleware, auditMiddleware, tenantMiddleware, paymentRoutes);
app.use('/api/expenses', authMiddleware, auditMiddleware, tenantMiddleware, featureMiddleware('feature_expenses'), expenseRoutes);
app.use('/api/salary', authMiddleware, auditMiddleware, tenantMiddleware, salaryRoutes);
app.use('/api/holidays', authMiddleware, auditMiddleware, tenantMiddleware, holidayRoutes);
app.use('/api/jug-tracking', authMiddleware, auditMiddleware, tenantMiddleware, featureMiddleware('feature_jug_tracking'), jugTrackingRoutes);
app.use('/api/profit', authMiddleware, auditMiddleware, tenantMiddleware, profitRoutes);

app.listen(PORT, async () => {
  console.log(`Jaltrack backend running at http://localhost:${PORT}`);

  const db = await testConnection();
  if (db.ok) {
    console.log(`✅ Database connected — ${db.type} @ ${db.host} (${db.db || ''})`);
    console.log('   All set. API is ready to accept requests.');
  } else {
    console.error(`❌ Database connection FAILED — ${db.error}`);
    console.error('   The server is running but API calls that need the database will fail.');
  }
});
