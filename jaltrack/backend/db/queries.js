import { query, withConnection } from './pool.js';

// ─── Helpers ────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtDateTime(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return '';
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const hm = dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  if (dt.toDateString() === now.toDateString()) return `Today, ${hm}`;
  if (dt.toDateString() === yesterday.toDateString()) return `Yesterday, ${hm}`;
  return `${fmtDate(dt)}, ${hm}`;
}

function fmtDateRange(start, end) {
  if (!start) return '';
  const s = start instanceof Date ? start : new Date(start);
  const e = end ? (end instanceof Date ? end : new Date(end)) : s;
  if (s.getTime() === e.getTime()) return fmtDate(s);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
    return `${s.getDate()}–${e.getDate()} ${MONTHS[s.getMonth()]} ${s.getFullYear()}`;
  return `${s.getDate()} ${MONTHS[s.getMonth()]} – ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

function countHolidayDaysInMonth(holidays, month, year) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const days = new Set();
  for (const h of holidays) {
    const s = new Date(Math.max(new Date(h.holiday_date).getTime(), first.getTime()));
    const e = new Date(Math.min(new Date(h.end_date || h.holiday_date).getTime(), last.getTime()));
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      days.add(d.toISOString().slice(0, 10));
    }
  }
  return days.size;
}

function curMonth() { return new Date().getMonth() + 1; }
function curYear() { return new Date().getFullYear(); }

function tenantWhere(alias, supplierId, prefix = 'AND') {
  if (!supplierId) return '';
  return `${prefix} ${alias}supplier_id = ${Number(supplierId)}`;
}

// ─── Dashboard ──────────────────────────────────────────────────

export async function getDashboardStats(supplierId) {
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';
  const today = new Date().toISOString().slice(0, 10);
  const [delRes, spotRes, jugRes, outRes, cashRes, successRes] = await Promise.all([
    query(`SELECT COUNT(*) AS cnt FROM deliveries WHERE delivery_date = ? ${tf}`, [today]),
    query(`SELECT COALESCE(SUM(jugs_given),0) AS total FROM spot_supply WHERE supply_date = ? ${tf}`, [today]),
    query(`SELECT COALESCE(SUM(jugs_out),0) - COALESCE(SUM(empty_in),0) AS pending FROM deliveries WHERE 1=1 ${tf}`),
    query(`SELECT COALESCE(SUM(outstanding),0) AS total FROM customers WHERE active = 1 ${tf}`),
    query(`SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE payment_date = ? AND status = ? ${tf}`, [today, 'Received']),
    query(`SELECT COALESCE(SUM(jugs_out),0) AS totalOut, COALESCE(SUM(empty_in),0) AS totalIn FROM deliveries WHERE 1=1 ${tf}`),
  ]);
  const totalOut = Number(successRes.rows[0]?.totalOut ?? 0);
  const totalIn = Number(successRes.rows[0]?.totalIn ?? 0);
  const deliveryCount = Number(delRes.rows[0]?.cnt ?? 0);
  const target = 60;
  return {
    todayDeliveries: deliveryCount,
    todayTarget: target,
    deliveryPercent: target ? Math.round((deliveryCount / target) * 100) : 0,
    spotSupplyJugs: Number(spotRes.rows[0]?.total ?? 0),
    pendingEmptyJugs: Number(jugRes.rows[0]?.pending ?? 0),
    outstanding: Number(outRes.rows[0]?.total ?? 0),
    cashCollected: Number(cashRes.rows[0]?.total ?? 0),
    deliverySuccessRate: 92,
    emptyJugReturnRate: totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : 0,
  };
}

export async function getDashboardAnalytics(supplierId) {
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';
  const m = curMonth();
  const y = curYear();

  const [weeklyDel, monthlyRev, topCustomers, custCount, expenseBreakdown, monthlyGrowth, jugFlow] = await Promise.all([
    query(`SELECT DATE(delivery_date) AS day, COUNT(*) AS cnt, SUM(jugs_out) AS jugs
       FROM deliveries WHERE delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ${tf}
       GROUP BY DATE(delivery_date) ORDER BY day`),

    query(`SELECT
       COALESCE((SELECT SUM(COALESCE(final_amount, total_amount)) FROM invoices i JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
         WHERE bc.cycle_month = ${m} AND bc.cycle_year = ${y} ${tf.replace('supplier_id', 'i.supplier_id')}), 0) AS billing,
       COALESCE((SELECT SUM(amount) FROM spot_supply WHERE MONTH(supply_date)=${m} AND YEAR(supply_date)=${y} ${tf}), 0) AS spot,
       COALESCE((SELECT SUM(amount) FROM expenses WHERE MONTH(expense_date)=${m} AND YEAR(expense_date)=${y} ${tf}), 0) AS expenses,
       COALESCE((SELECT SUM(total_amount) FROM salary WHERE period_month=${m} AND period_year=${y} ${tf}), 0) AS salaries,
       COALESCE((SELECT SUM(amount) FROM payments WHERE MONTH(payment_date)=${m} AND YEAR(payment_date)=${y} AND status='Received' ${tf}), 0) AS collected`),

    query(`SELECT c.full_name AS name, c.shop_name AS shopName,
       COALESCE(SUM(d.jugs_out),0) AS totalJugs, c.outstanding
       FROM customers c LEFT JOIN deliveries d ON d.customer_id = c.id AND MONTH(d.delivery_date)=${m} AND YEAR(d.delivery_date)=${y}
       WHERE c.active = 1 ${tf.replace('supplier_id', 'c.supplier_id')}
       GROUP BY c.id ORDER BY totalJugs DESC LIMIT 5`),

    query(`SELECT COUNT(*) AS total,
       SUM(CASE WHEN outstanding > 0 THEN 1 ELSE 0 END) AS withOutstanding
       FROM customers WHERE active = 1 ${tf}`),

    query(`SELECT COALESCE(category,'Other') AS category, SUM(amount) AS total
       FROM expenses WHERE MONTH(expense_date)=${m} AND YEAR(expense_date)=${y} ${tf}
       GROUP BY category ORDER BY total DESC`),

    query(`SELECT
       MONTH(d.delivery_date) AS m, YEAR(d.delivery_date) AS y,
       COUNT(*) AS deliveries, SUM(d.jugs_out) AS jugs
       FROM deliveries d WHERE d.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) ${tf.replace('supplier_id', 'd.supplier_id')}
       GROUP BY YEAR(d.delivery_date), MONTH(d.delivery_date) ORDER BY y, m`),

    query(`SELECT
       COALESCE(SUM(jugs_out),0) AS totalOut, COALESCE(SUM(empty_in),0) AS totalIn
       FROM deliveries WHERE MONTH(delivery_date)=${m} AND YEAR(delivery_date)=${y} ${tf}`),
  ]);

  const rev = monthlyRev.rows[0] || {};
  const billing = Number(rev.billing ?? 0);
  const spot = Number(rev.spot ?? 0);
  const expenses = Number(rev.expenses ?? 0);
  const salaries = Number(rev.salaries ?? 0);
  const collected = Number(rev.collected ?? 0);
  const totalRevenue = billing + spot;
  const totalExpenses = expenses + salaries;
  const profit = totalRevenue - totalExpenses;

  const MONTHS_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    weeklyDeliveries: weeklyDel.rows.map((r) => ({
      day: new Date(r.day).toLocaleDateString('en-IN', { weekday: 'short' }),
      deliveries: Number(r.cnt),
      jugs: Number(r.jugs || 0),
    })),
    revenue: { billing, spot, totalRevenue, expenses, salaries, totalExpenses, profit, collected },
    topCustomers: topCustomers.rows.map((r) => ({
      name: r.name, shopName: r.shopName, totalJugs: Number(r.totalJugs), outstanding: Number(r.outstanding ?? 0),
    })),
    customerStats: {
      total: Number(custCount.rows[0]?.total ?? 0),
      withOutstanding: Number(custCount.rows[0]?.withOutstanding ?? 0),
    },
    expenseBreakdown: expenseBreakdown.rows.map((r) => ({ category: r.category, amount: Number(r.total) })),
    monthlyGrowth: monthlyGrowth.rows.map((r) => ({
      month: MONTHS_SHORT[r.m], deliveries: Number(r.deliveries), jugs: Number(r.jugs || 0),
    })),
    jugFlow: { out: Number(jugFlow.rows[0]?.totalOut ?? 0), returned: Number(jugFlow.rows[0]?.totalIn ?? 0) },
  };
}

export async function getDashboardActivity(limit = 20, supplierId) {
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';
  const sql = `
    (SELECT d.id, d.created_at AS dt, 'Delivery' AS type,
       c.full_name AS customer, '' AS sub,
       CONCAT(d.jugs_out, ' Jugs') AS amount,
       d.payment_status AS status
     FROM deliveries d LEFT JOIN customers c ON c.id = d.customer_id WHERE 1=1 ${tf.replace('supplier_id', 'd.supplier_id')})
    UNION ALL
    (SELECT s.id, s.created_at AS dt, 'Spot Supply' AS type,
       s.location_name AS customer, '' AS sub,
       CONCAT(s.jugs_given, ' Jugs') AS amount,
       s.payment_mode AS status
     FROM spot_supply s WHERE 1=1 ${tf.replace('supplier_id', 's.supplier_id')})
    UNION ALL
    (SELECT p.id, p.created_at AS dt, 'Payment' AS type,
       c.full_name AS customer, '' AS sub,
       CONCAT('₹', p.amount) AS amount,
       COALESCE(p.status,'Received') AS status
     FROM payments p LEFT JOIN customers c ON c.id = p.customer_id
     WHERE p.amount > 0 ${tf.replace('supplier_id', 'p.supplier_id')})
    ORDER BY dt DESC LIMIT ${Number(limit)}`;
  const res = await query(sql, []);
  return res.rows.map((r) => ({
    id: r.id,
    dateTime: fmtDateTime(r.dt),
    type: r.type,
    customer: r.customer || '',
    sub: r.sub || '',
    amount: r.amount || '',
    status: r.status || '',
  }));
}

// ─── Customers ──────────────────────────────────────────────────

export async function getCustomers(supplierId) {
  const tf = tenantWhere('c.', supplierId);
  const res = await query(
    `SELECT c.id, c.full_name AS name, c.shop_name AS shopName, c.phone, c.rate_per_jug AS rate,
       c.joining_date AS joined, c.holiday_billing_chargeable AS holidayBilling,
       COALESCE((SELECT SUM(d.jugs_out) - SUM(d.empty_in) FROM deliveries d WHERE d.customer_id = c.id), 0) AS pending,
       c.outstanding
     FROM customers c WHERE c.active = 1 ${tf} ORDER BY c.full_name`
  );
  return res.rows.map((r) => ({
    ...r,
    joined: fmtDate(r.joined),
    holidayBilling: !!r.holidayBilling,
    pending: Number(r.pending),
    outstanding: Number(r.outstanding),
    rate: Number(r.rate),
  }));
}

export async function createCustomer(data, supplierId) {
  const sid = supplierId || 1;
  const params = [
    data.name, data.shopName || null, data.phone || '', data.address || '',
    Number(data.rate) || 0,
    data.joined || new Date().toISOString().slice(0, 10),
    data.holidayBilling !== false ? 1 : 0,
    sid,
  ];
  return withConnection(async (conn) => {
    await conn.query(
      `INSERT INTO customers (full_name, shop_name, phone, address, rate_per_jug, joining_date, holiday_billing_chargeable, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, params
    );
    const res = await conn.query(
      `SELECT id, full_name AS name, shop_name AS shopName, phone, rate_per_jug AS rate,
         joining_date AS joined, holiday_billing_chargeable AS holidayBilling,
         0 AS pending, 0 AS outstanding
       FROM customers WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? { ...r, joined: fmtDate(r.joined), holidayBilling: !!r.holidayBilling, rate: Number(r.rate) } : null;
  });
}

export async function updateCustomer(id, data, supplierId) {
  const fields = [];
  const vals = [];
  if (data.name !== undefined)    { fields.push('full_name = ?'); vals.push(data.name); }
  if (data.shopName !== undefined) { fields.push('shop_name = ?'); vals.push(data.shopName || null); }
  if (data.phone !== undefined)   { fields.push('phone = ?'); vals.push(data.phone); }
  if (data.address !== undefined) { fields.push('address = ?'); vals.push(data.address); }
  if (data.rate !== undefined)    { fields.push('rate_per_jug = ?'); vals.push(Number(data.rate)); }
  if (data.holidayBilling !== undefined) { fields.push('holiday_billing_chargeable = ?'); vals.push(data.holidayBilling ? 1 : 0); }
  if (fields.length === 0) return null;
  let where = 'WHERE id = ?';
  vals.push(Number(id));
  if (supplierId) { where += ' AND supplier_id = ?'; vals.push(supplierId); }
  await query(`UPDATE customers SET ${fields.join(', ')} ${where}`, vals);
  const res = await query(
    `SELECT id, full_name AS name, shop_name AS shopName, phone, rate_per_jug AS rate,
       joining_date AS joined, holiday_billing_chargeable AS holidayBilling,
       pending_jugs AS pending, outstanding
     FROM customers WHERE id = ?`, [id]
  );
  const r = res.rows[0];
  return r ? { ...r, joined: fmtDate(r.joined), holidayBilling: !!r.holidayBilling, rate: Number(r.rate) } : null;
}

// ─── Deliveries ─────────────────────────────────────────────────

export async function getDeliveries(limit = 50, supplierId) {
  const tf = tenantWhere('d.', supplierId);
  const res = await query(
    `SELECT d.id, d.delivery_date AS date, c.full_name AS customer,
       d.jugs_out AS jugsOut, d.empty_in AS emptyIn,
       d.payment_status AS payment, u.full_name AS agent
     FROM deliveries d
     LEFT JOIN customers c ON c.id = d.customer_id
     LEFT JOIN users u ON u.id = d.delivery_boy_id
     WHERE 1=1 ${tf}
     ORDER BY d.delivery_date DESC, d.id DESC LIMIT ?`, [limit]
  );
  return res.rows.map((r) => ({ ...r, date: fmtDate(r.date) }));
}

export async function createDelivery(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const date = data.date || new Date().toISOString().slice(0, 10);
    const jugsOut = Number(data.jugsOut) || 0;
    const emptyIn = Number(data.emptyIn) || 0;
    const routeId = data.routeId || null;
    const routeStopId = data.routeStopId || null;
    await conn.query(
      `INSERT INTO deliveries (delivery_date, customer_id, delivery_boy_id, jugs_out, empty_in, payment_status, supplier_id, route_id, route_stop_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [date, data.customerId || null, data.agentId || null, jugsOut, emptyIn, data.payment || 'Pending', sid, routeId, routeStopId]
    );
    const net = jugsOut - emptyIn;
    if (net !== 0 && data.customerId) {
      await conn.query('UPDATE customers SET pending_jugs = pending_jugs + ? WHERE id = ?', [net, data.customerId]);
    }
    const res = await conn.query(
      `SELECT d.id, d.delivery_date AS date, c.full_name AS customer,
         d.jugs_out AS jugsOut, d.empty_in AS emptyIn,
         d.payment_status AS payment, u.full_name AS agent
       FROM deliveries d
       LEFT JOIN customers c ON c.id = d.customer_id
       LEFT JOIN users u ON u.id = d.delivery_boy_id
       WHERE d.id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? { ...r, date: fmtDate(r.date) } : null;
  });
}

// ─── Routes (Planned Delivery / Route Management) ────────────────

export async function getRoutes(filters, supplierId) {
  const tf = tenantWhere('r.', supplierId);
  let sql = `SELECT r.id, r.name, r.route_date AS routeDate, r.delivery_boy_id AS deliveryBoyId,
    u.full_name AS deliveryBoyName, r.status, r.started_at AS startedAt, r.completed_at AS completedAt,
    (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id) AS stopCount
    FROM routes r
    LEFT JOIN users u ON u.id = r.delivery_boy_id
    WHERE 1=1 ${tf}`;
  const params = [];
  if (filters?.date) { sql += ' AND r.route_date = ?'; params.push(filters.date); }
  if (filters?.deliveryBoyId) { sql += ' AND r.delivery_boy_id = ?'; params.push(filters.deliveryBoyId); }
  if (filters?.status) { sql += ' AND r.status = ?'; params.push(filters.status); }
  sql += ' ORDER BY r.route_date DESC, r.id DESC';
  const res = await query(sql, params);
  return res.rows.map((r) => ({
    ...r,
    routeDate: fmtDate(r.routeDate),
    stopCount: Number(r.stopCount),
    startedAt: r.startedAt ? fmtDateTime(r.startedAt) : null,
    completedAt: r.completedAt ? fmtDateTime(r.completedAt) : null,
  }));
}

export async function getRouteById(id, supplierId) {
  const tf = tenantWhere('r.', supplierId);
  const routeRes = await query(
    `SELECT r.id, r.name, r.route_date AS routeDate, r.delivery_boy_id AS deliveryBoyId,
       u.full_name AS deliveryBoyName, r.status, r.started_at AS startedAt, r.completed_at AS completedAt
     FROM routes r LEFT JOIN users u ON u.id = r.delivery_boy_id
     WHERE r.id = ? ${tf}`, [id]
  );
  const route = routeRes.rows[0];
  if (!route) return null;

  const stopsRes = await query(
    `SELECT rs.id, rs.customer_id AS customerId, rs.sequence_order AS sequenceOrder,
       rs.expected_delivery_qty AS expectedDelivery, rs.expected_empty_qty AS expectedEmpty,
       rs.actual_delivery_qty AS actualDelivery, rs.actual_empty_qty AS actualEmpty,
       rs.delivery_variance AS deliveryVariance, rs.empty_variance AS emptyVariance,
       rs.confirmed_at AS confirmedAt, rs.payment_status AS paymentStatus, rs.notes,
       c.full_name AS customerName, c.shop_name AS shopName, c.pending_jugs AS pendingJugs
     FROM route_stops rs
     JOIN customers c ON c.id = rs.customer_id
     WHERE rs.route_id = ? ORDER BY rs.sequence_order`,
    [id]
  );
  const stops = stopsRes.rows.map((s) => ({
    ...s,
    expectedDelivery: Number(s.expectedDelivery ?? 0),
    expectedEmpty: Number(s.expectedEmpty ?? 0),
    actualDelivery: s.actualDelivery != null ? Number(s.actualDelivery) : null,
    actualEmpty: s.actualEmpty != null ? Number(s.actualEmpty) : null,
    deliveryVariance: s.deliveryVariance != null ? Number(s.deliveryVariance) : null,
    emptyVariance: s.emptyVariance != null ? Number(s.emptyVariance) : null,
    pendingJugs: Number(s.pendingJugs ?? 0),
    confirmedAt: s.confirmedAt ? fmtDateTime(s.confirmedAt) : null,
  }));
  const routeDateRaw = route.routeDate instanceof Date
    ? route.routeDate.toISOString().slice(0, 10)
    : String(route.routeDate || '').slice(0, 10);
  return { ...route, routeDate: fmtDate(route.routeDate), routeDateRaw: routeDateRaw || null, stops };
}

export async function createRoute(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const routeDate = data.routeDate || data.date || new Date().toISOString().slice(0, 10);
    await conn.query(
      `INSERT INTO routes (name, route_date, delivery_boy_id, supplier_id, status)
       VALUES (?, ?, ?, ?, 'draft')`,
      [data.name || 'Unnamed Route', routeDate, data.deliveryBoyId, sid]
    );
    const routeIdRes = await conn.query('SELECT LAST_INSERT_ID() AS id');
    const routeId = routeIdRes.rows[0].id;
    const stops = data.stops || [];
    for (let i = 0; i < stops.length; i++) {
      const s = stops[i];
      await conn.query(
        `INSERT INTO route_stops (route_id, customer_id, sequence_order, expected_delivery_qty, expected_empty_qty)
         VALUES (?, ?, ?, ?, ?)`,
        [routeId, s.customerId, i + 1, Number(s.expectedDelivery ?? 0), Number(s.expectedEmpty ?? 0)]
      );
    }
    return getRouteById(routeId, supplierId);
  });
}

export async function updateRoute(id, data, supplierId) {
  const route = await getRouteById(id, supplierId);
  if (!route) return null;
  const sid = supplierId || 1;
  const isDraft = route.status === 'draft';
  const statusOnly = data.status != null && Object.keys(data).length === 1;
  if (statusOnly && isDraft && (data.status === 'active' || data.status === 'cancelled')) {
    await query('UPDATE routes SET status = ? WHERE id = ?', [data.status, id]);
    return getRouteById(id, supplierId);
  }
  if (!isDraft) return null;
  return withConnection(async (conn) => {
    if (data.name != null) await conn.query('UPDATE routes SET name = ? WHERE id = ?', [data.name, id]);
    if (data.routeDate != null) await conn.query('UPDATE routes SET route_date = ? WHERE id = ?', [data.routeDate, id]);
    if (data.deliveryBoyId != null) await conn.query('UPDATE routes SET delivery_boy_id = ? WHERE id = ?', [data.deliveryBoyId, id]);
    if (data.stops && Array.isArray(data.stops)) {
      await conn.query('DELETE FROM route_stops WHERE route_id = ?', [id]);
      for (let i = 0; i < data.stops.length; i++) {
        const s = data.stops[i];
        await conn.query(
          `INSERT INTO route_stops (route_id, customer_id, sequence_order, expected_delivery_qty, expected_empty_qty)
           VALUES (?, ?, ?, ?, ?)`,
          [id, s.customerId, i + 1, Number(s.expectedDelivery ?? 0), Number(s.expectedEmpty ?? 0)]
        );
      }
    }
    return getRouteById(id, supplierId);
  });
}

export async function deleteRoute(id, supplierId) {
  const route = await getRouteById(id, supplierId);
  if (!route || route.status !== 'draft') return false;
  await query('DELETE FROM route_stops WHERE route_id = ?', [id]);
  await query('DELETE FROM routes WHERE id = ?', [id]);
  return true;
}

export async function getRouteSummary(id, supplierId) {
  const route = await getRouteById(id, supplierId);
  if (!route) return null;
  const stops = route.stops || [];
  const totalExpectedDelivery = stops.reduce((s, x) => s + (x.expectedDelivery ?? 0), 0);
  const totalExpectedEmpty = stops.reduce((s, x) => s + (x.expectedEmpty ?? 0), 0);
  const totalActualDelivery = stops.reduce((s, x) => s + (x.actualDelivery ?? 0), 0);
  const totalActualEmpty = stops.reduce((s, x) => s + (x.actualEmpty ?? 0), 0);
  return {
    ...route,
    totalExpectedDelivery,
    totalExpectedEmpty,
    totalActualDelivery,
    totalActualEmpty,
    deliveryVariance: totalActualDelivery - totalExpectedDelivery,
    emptyVariance: totalActualEmpty - totalExpectedEmpty,
  };
}

export async function getDeliveryBoyRouteToday(deliveryBoyId) {
  // Use DB's CURDATE() so "today" matches what we allow in confirmRouteStop (avoids timezone bugs)
  const res = await query(
    `SELECT r.id, r.name, r.route_date AS routeDate, r.status
     FROM routes r
     WHERE r.delivery_boy_id = ? AND r.route_date = CURDATE() AND r.status IN ('active','in_progress','completed')
     ORDER BY r.id DESC LIMIT 1`,
    [deliveryBoyId]
  );
  const route = res.rows[0];
  if (!route) return null;
  const stopsRes = await query(
    `SELECT rs.id, rs.customer_id AS customerId, rs.sequence_order AS sequenceOrder,
       rs.expected_delivery_qty AS expectedDelivery, rs.expected_empty_qty AS expectedEmpty,
       rs.actual_delivery_qty AS actualDelivery, rs.actual_empty_qty AS actualEmpty,
       rs.confirmed_at AS confirmedAt, rs.payment_status AS paymentStatus,
       c.full_name AS customerName, c.shop_name AS shopName, c.pending_jugs AS pendingJugs, c.address
     FROM route_stops rs
     JOIN customers c ON c.id = rs.customer_id
     WHERE rs.route_id = ? ORDER BY rs.sequence_order`,
    [route.id]
  );
  const stops = stopsRes.rows.map((s) => ({
    id: s.id,
    customerId: s.customerId,
    sequenceOrder: Number(s.sequenceOrder),
    customerName: s.customerName,
    shopName: s.shopName,
    address: s.address,
    pendingJugs: Number(s.pendingJugs ?? 0),
    expectedDelivery: Number(s.expectedDelivery ?? 0),
    expectedEmpty: Number(s.expectedEmpty ?? 0),
    actualDelivery: s.actualDelivery != null ? Number(s.actualDelivery) : null,
    actualEmpty: s.actualEmpty != null ? Number(s.actualEmpty) : null,
    confirmedAt: s.confirmedAt ? fmtDateTime(s.confirmedAt) : null,
    paymentStatus: s.paymentStatus,
  }));
  return { id: route.id, name: route.name, routeDate: fmtDate(route.routeDate), status: route.status, stops };
}

export async function confirmRouteStop(deliveryBoyId, routeId, stopId, data) {
  // Use same "today" as getDeliveryBoyRouteToday: DB's CURDATE(). If we see this route in Today, confirm is allowed.
  const today = new Date().toISOString().slice(0, 10);
  return withConnection(async (conn) => {
    const routeRes = await conn.query(
      'SELECT id, route_date, delivery_boy_id, supplier_id FROM routes WHERE id = ? AND delivery_boy_id = ? AND route_date = CURDATE()',
      [routeId, deliveryBoyId]
    );
    if (routeRes.rows.length === 0) {
      return { error: 'Route not found, not assigned to you, or not scheduled for today', status: 403 };
    }
    const route = routeRes.rows[0];
    const stopRes = await conn.query(
      'SELECT id, customer_id, expected_delivery_qty, expected_empty_qty, delivery_id FROM route_stops WHERE id = ? AND route_id = ?',
      [stopId, routeId]
    );
    if (stopRes.rows.length === 0) {
      return { error: 'Stop not found', status: 404 };
    }
    const stop = stopRes.rows[0];
    const actualDelivery = Number(data.actualDeliveryQty ?? data.actual_delivery_qty ?? 0);
    const actualEmpty = Number(data.actualEmptyQty ?? data.actual_empty_qty ?? 0);
    const paymentStatus = data.paymentStatus || (data.paymentCollected ? (data.paymentMode || 'Cash') : 'Pending');
    const notes = data.notes || data.remarks || null;
    const sid = route.supplier_id || 1;

    let deliveryId = stop.delivery_id;
    if (deliveryId) {
      await conn.query(
        `UPDATE deliveries SET jugs_out = ?, empty_in = ?, payment_status = ?, notes = ? WHERE id = ?`,
        [actualDelivery, actualEmpty, paymentStatus, notes, deliveryId]
      );
      const prevRes = await conn.query('SELECT jugs_out, empty_in FROM deliveries WHERE id = ?', [deliveryId]);
      const prev = prevRes.rows[0];
      const prevNet = (Number(prev?.jugs_out) || 0) - (Number(prev?.empty_in) || 0);
      const newNet = actualDelivery - actualEmpty;
      const delta = newNet - prevNet;
      if (delta !== 0 && stop.customer_id) {
        await conn.query('UPDATE customers SET pending_jugs = pending_jugs + ? WHERE id = ?', [delta, stop.customer_id]);
      }
    } else {
      await conn.query(
        `INSERT INTO deliveries (delivery_date, customer_id, delivery_boy_id, jugs_out, empty_in, payment_status, notes, supplier_id, route_id, route_stop_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [today, stop.customer_id, deliveryBoyId, actualDelivery, actualEmpty, paymentStatus, notes, sid, routeId, stopId]
      );
      const idRes = await conn.query('SELECT LAST_INSERT_ID() AS id');
      deliveryId = idRes.rows[0].id;
      const net = actualDelivery - actualEmpty;
      if (net !== 0 && stop.customer_id) {
        await conn.query('UPDATE customers SET pending_jugs = pending_jugs + ? WHERE id = ?', [net, stop.customer_id]);
      }
    }

    const deliveryVariance = actualDelivery - Number(stop.expected_delivery_qty || 0);
    const emptyVariance = actualEmpty - Number(stop.expected_empty_qty || 0);
    await conn.query(
      `UPDATE route_stops SET actual_delivery_qty = ?, actual_empty_qty = ?, delivery_id = ?, confirmed_at = NOW(),
       payment_status = ?, notes = ?, delivery_variance = ?, empty_variance = ? WHERE id = ?`,
      [actualDelivery, actualEmpty, deliveryId, paymentStatus, notes, deliveryVariance, emptyVariance, stopId]
    );

    const startedRes = await conn.query('SELECT started_at FROM routes WHERE id = ?', [routeId]);
    if (startedRes.rows[0] && !startedRes.rows[0].started_at) {
      await conn.query('UPDATE routes SET started_at = NOW(), status = ? WHERE id = ?', ['in_progress', routeId]);
    }
    const allConfirmed = await conn.query('SELECT id FROM route_stops WHERE route_id = ? AND confirmed_at IS NULL', [routeId]);
    if (allConfirmed.rows.length === 0) {
      await conn.query('UPDATE routes SET completed_at = NOW(), status = ? WHERE id = ?', ['completed', routeId]);
    }

    const updated = await conn.query(
      `SELECT rs.id, rs.actual_delivery_qty AS actualDelivery, rs.actual_empty_qty AS actualEmpty,
         rs.delivery_variance AS deliveryVariance, rs.empty_variance AS emptyVariance
       FROM route_stops rs WHERE rs.id = ?`,
      [stopId]
    );
    const r = updated.rows[0];
    return {
      success: true,
      stop: {
        id: stopId,
        actualDelivery,
        actualEmpty,
        deliveryVariance: r ? Number(r.deliveryVariance) : deliveryVariance,
        emptyVariance: r ? Number(r.emptyVariance) : emptyVariance,
      },
    };
  });
}

// ─── Spot Supply ────────────────────────────────────────────────

export async function getSpotSupplyList(supplierId) {
  const tf = tenantWhere('', supplierId, 'AND');
  const res = await query(
    `SELECT id, supply_date AS date, location_name AS location,
       jugs_given AS jugs, payment_mode AS mode, amount, internal_notes AS notes
     FROM spot_supply WHERE 1=1 ${tf} ORDER BY supply_date DESC, id DESC`
  );
  return res.rows.map((r) => ({
    ...r,
    date: fmtDate(r.date),
    jugs: Number(r.jugs),
    amount: Number(r.amount),
  }));
}

export async function createSpotSupply(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const date = new Date().toISOString().slice(0, 10);
    await conn.query(
      `INSERT INTO spot_supply (supply_date, location_name, jugs_given, amount, payment_mode, internal_notes, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, data.location || '', Number(data.jugs) || 0, Number(data.amount) || 0, data.mode || 'Pending', data.notes || '', sid]
    );
    const res = await conn.query(
      `SELECT id, supply_date AS date, location_name AS location,
         jugs_given AS jugs, payment_mode AS mode, amount, internal_notes AS notes
       FROM spot_supply WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? { ...r, date: fmtDate(r.date), jugs: Number(r.jugs), amount: Number(r.amount) } : null;
  });
}

// ─── Events ─────────────────────────────────────────────────────

export async function getEvents(supplierId) {
  const tf = tenantWhere('', supplierId, 'AND');
  const res = await query(
    `SELECT id, event_name, start_date, end_date, rate_per_jug AS rate, deposit, advance_pay AS advancePay, status
     FROM events WHERE 1=1 ${tf} ORDER BY start_date DESC`
  );
  return res.rows.map((r) => ({
    id: r.id,
    name: r.event_name,
    dates: fmtDateRange(r.start_date, r.end_date),
    rate: Number(r.rate),
    deposit: Number(r.deposit),
    advancePay: r.advancePay != null ? Number(r.advancePay) : null,
    status: r.status,
  }));
}

export async function createEvent(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const advancePay = data.advancePay !== undefined && data.advancePay !== '' && data.advancePay !== null ? Number(data.advancePay) : null;
    await conn.query(
      `INSERT INTO events (event_name, start_date, end_date, rate_per_jug, deposit, advance_pay, notes, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.startDate, data.endDate, Number(data.rate) || 0, Number(data.deposit) || 0, advancePay, data.notes || '', sid]
    );
    const res = await conn.query(
      `SELECT id, event_name, start_date, end_date, rate_per_jug AS rate, deposit, advance_pay AS advancePay, status
       FROM events WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? {
      id: r.id, name: r.event_name,
      dates: fmtDateRange(r.start_date, r.end_date),
      rate: Number(r.rate), deposit: Number(r.deposit), advancePay: r.advancePay != null ? Number(r.advancePay) : null, status: r.status,
    } : null;
  });
}

export async function getEventDetail(id, supplierId) {
  const tf = tenantWhere('e.', supplierId);
  const res = await query(
    `SELECT e.id, e.event_name AS name, e.rate_per_jug AS rate, e.deposit, e.advance_pay AS advancePay,
       COALESCE(SUM(es.jugs_out), 0) AS supplied,
       COALESCE(SUM(es.jugs_returned), 0) AS returned
     FROM events e
     LEFT JOIN event_supply es ON es.event_id = e.id
     WHERE e.id = ? ${tf}
     GROUP BY e.id`, [id]
  );
  const r = res.rows[0];
  if (!r) return null;
  const supplied = Number(r.supplied);
  const returned = Number(r.returned);
  const rate = Number(r.rate);
  const deposit = Number(r.deposit);
  const missing = supplied - returned;
  const penalty = missing * rate;
  const refund = Math.max(0, deposit - penalty);
  return { id: r.id, name: r.name, supplied, returned, missing, penalty, refund, advancePay: r.advancePay != null ? Number(r.advancePay) : null };
}

export async function updateEvent(id, data, supplierId) {
  const fields = [];
  const vals = [];
  if (data.status !== undefined) { fields.push('status = ?'); vals.push(data.status); }
  if (data.name !== undefined)   { fields.push('event_name = ?'); vals.push(data.name); }
  if (data.advancePay !== undefined) { fields.push('advance_pay = ?'); vals.push(data.advancePay === '' || data.advancePay === null ? null : Number(data.advancePay)); }
  if (fields.length === 0) return null;
  let where = 'WHERE id = ?';
  vals.push(Number(id));
  if (supplierId) { where += ' AND supplier_id = ?'; vals.push(supplierId); }
  await query(`UPDATE events SET ${fields.join(', ')} ${where}`, vals);
  return { id: Number(id), ...data };
}

// ─── Billing ────────────────────────────────────────────────────

export async function getInvoices(month, year, supplierId) {
  const m = month ?? curMonth();
  const y = year ?? curYear();
  const tf = tenantWhere('i.', supplierId);
  const res = await query(
    `SELECT i.id, c.full_name AS customer, i.chargeable_days AS days,
       i.rate_per_jug AS rate, i.total_amount AS total,
       COALESCE(i.discount, 0) AS discount,
       COALESCE(i.additional_charges, 0) AS additional,
       COALESCE(i.final_amount, i.total_amount) AS finalAmt
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
     WHERE bc.cycle_month = ? AND bc.cycle_year = ? ${tf}
     ORDER BY c.full_name`, [m, y]
  );
  return res.rows.map((r) => ({
    id: r.id, customer: r.customer,
    days: Number(r.days), rate: Number(r.rate), total: Number(r.total),
    discount: Number(r.discount), additional: Number(r.additional), final: Number(r.finalAmt),
  }));
}

export async function generateBilling(month, year, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';

    let cycleRes = await conn.query(
      `SELECT id FROM billing_cycles WHERE cycle_month = ? AND cycle_year = ? ${tf}`, [month, year]
    );
    let cycleId;
    if (cycleRes.rows.length === 0) {
      await conn.query('INSERT INTO billing_cycles (cycle_month, cycle_year, supplier_id) VALUES (?, ?, ?)', [month, year, sid]);
      const idRes = await conn.query('SELECT LAST_INSERT_ID() AS id');
      cycleId = idRes.rows[0].id;
    } else {
      cycleId = cycleRes.rows[0].id;
      await conn.query('DELETE FROM invoices WHERE billing_cycle_id = ?', [cycleId]);
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = `${year}-${String(month).padStart(2, '0')}-${daysInMonth}`;

    const holRes = await conn.query(
      `SELECT holiday_date, COALESCE(end_date, holiday_date) AS end_date
       FROM supplier_holidays
       WHERE holiday_date <= ? AND COALESCE(end_date, holiday_date) >= ? ${tf}`,
      [lastDay, firstDay]
    );
    const supplierHolDays = countHolidayDaysInMonth(holRes.rows, month, year);

    const custRes = await conn.query(
      `SELECT id, rate_per_jug, holiday_billing_chargeable FROM customers WHERE active = 1 ${tf}`
    );

    for (const cust of custRes.rows) {
      const chRes = await conn.query(
        'SELECT COUNT(*) AS cnt FROM client_holidays WHERE customer_id = ? AND holiday_date BETWEEN ? AND ?',
        [cust.id, firstDay, lastDay]
      );
      const clientHolDays = Number(chRes.rows[0]?.cnt ?? 0);

      let chargeableDays = daysInMonth - supplierHolDays;
      if (!cust.holiday_billing_chargeable) {
        chargeableDays -= clientHolDays;
      }
      chargeableDays = Math.max(0, chargeableDays);

      const rate = Number(cust.rate_per_jug);
      const total = chargeableDays * rate;

      await conn.query(
        `INSERT INTO invoices
           (billing_cycle_id, customer_id, total_days, supplier_hol_days, client_hol_days, chargeable_days, rate_per_jug, total_amount, final_amount, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cycleId, cust.id, daysInMonth, supplierHolDays, clientHolDays, chargeableDays, rate, total, total, sid]
      );
    }
    return true;
  });
}

export async function getInvoiceDetail(id, supplierId) {
  const tf = supplierId ? `AND i.supplier_id = ${Number(supplierId)}` : '';
  const res = await query(
    `SELECT i.id, i.total_days AS totalDays, i.supplier_hol_days AS supplierHolidays,
       i.client_hol_days AS clientHolidays, i.chargeable_days AS chargeableDays,
       i.rate_per_jug AS ratePerJug, i.total_amount AS baseAmount,
       COALESCE(i.discount, 0) AS discount,
       COALESCE(i.additional_charges, 0) AS additionalCharges,
       COALESCE(i.final_amount, i.total_amount) AS finalAmount,
       i.remarks, i.status, i.created_at AS createdAt,
       c.full_name AS customerName, c.shop_name AS shopName, c.phone AS customerPhone,
       c.address AS customerAddress, c.rate_per_jug AS customerRate,
       bc.cycle_month AS cycleMonth, bc.cycle_year AS cycleYear,
       b.name AS businessName, b.phone AS businessPhone, b.address AS businessAddress,
       b.city AS businessCity
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
     LEFT JOIN businesses b ON b.id = i.supplier_id
     WHERE i.id = ? ${tf}`, [id]
  );
  const r = res.rows[0];
  if (!r) return null;

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return {
    id: r.id,
    invoiceNumber: `JT-${r.cycleYear}${String(r.cycleMonth).padStart(2, '0')}-${String(r.id).padStart(4, '0')}`,
    month: `${monthNames[r.cycleMonth]} ${r.cycleYear}`,
    cycleMonth: r.cycleMonth,
    cycleYear: r.cycleYear,
    customerName: r.customerName,
    shopName: r.shopName || null,
    customerPhone: r.customerPhone,
    customerAddress: r.customerAddress || '',
    totalDays: Number(r.totalDays),
    supplierHolidays: Number(r.supplierHolidays),
    clientHolidays: Number(r.clientHolidays),
    chargeableDays: Number(r.chargeableDays),
    ratePerJug: Number(r.ratePerJug),
    baseAmount: Number(r.baseAmount),
    discount: Number(r.discount),
    additionalCharges: Number(r.additionalCharges),
    finalAmount: Number(r.finalAmount),
    remarks: r.remarks || '',
    status: r.status,
    createdAt: r.createdAt,
    businessName: r.businessName || 'JalTrack Water Supply',
    businessPhone: r.businessPhone || '',
    businessAddress: r.businessAddress || '',
    businessCity: r.businessCity || '',
  };
}

export async function adjustInvoice(id, data, supplierId) {
  const discount = Number(data.discount) || 0;
  const additional = Number(data.additional) || 0;
  const remarks = data.remarks || '';
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';
  await query(
    `UPDATE invoices SET discount = ?, additional_charges = ?, remarks = ?,
       final_amount = total_amount - ? + ? WHERE id = ? ${tf}`,
    [discount, additional, remarks, discount, additional, id]
  );
  const res = await query(
    `SELECT i.id, c.full_name AS customer, i.chargeable_days AS days,
       i.rate_per_jug AS rate, i.total_amount AS total,
       i.discount, i.additional_charges AS additional,
       COALESCE(i.final_amount, i.total_amount) AS finalAmt
     FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`, [id]
  );
  const r = res.rows[0];
  return r ? { id: r.id, customer: r.customer, days: Number(r.days), rate: Number(r.rate), total: Number(r.total), discount: Number(r.discount), additional: Number(r.additional), final: Number(r.finalAmt) } : null;
}

// ─── Payments ───────────────────────────────────────────────────

export async function getPaymentsList(supplierId) {
  const tf = tenantWhere('c.', supplierId);
  const res = await query(
    `SELECT c.id, c.full_name AS customer, c.outstanding,
       (SELECT p.promise_date FROM payments p
        WHERE p.customer_id = c.id AND p.status = 'Promised' AND p.promise_date >= CURDATE()
        ORDER BY p.promise_date DESC LIMIT 1) AS promiseDate,
       DATEDIFF(CURDATE(), COALESCE(
         (SELECT MAX(p2.payment_date) FROM payments p2 WHERE p2.customer_id = c.id AND p2.status = 'Received'),
         c.joining_date
       )) AS daysPending
     FROM customers c WHERE c.active = 1 ${tf}
     ORDER BY c.outstanding DESC`
  );
  return res.rows.map((r) => {
    const outstanding = Number(r.outstanding);
    const daysPending = Number(r.daysPending) || 0;
    const promiseDate = r.promiseDate ? fmtDate(r.promiseDate) : '—';
    let status = 'Pending';
    if (outstanding <= 0) status = 'Cleared';
    else if (r.promiseDate) status = 'Promised';
    else if (daysPending > 30) status = 'Overdue';
    return { id: r.id, customer: r.customer, outstanding, daysPending, promiseDate, status };
  });
}

export async function markPaymentReceived(customerId, data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const amount = Number(data.amount) || 0;
    const mode = data.mode || 'Cash';
    const payDate = data.date || new Date().toISOString().slice(0, 10);
    await conn.query(
      `INSERT INTO payments (customer_id, amount, payment_date, mode, status, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, amount, payDate, mode, 'Received', sid]
    );
    await conn.query(
      'UPDATE customers SET outstanding = GREATEST(0, outstanding - ?) WHERE id = ?',
      [amount, customerId]
    );
    return { customerId, amount, mode, date: payDate };
  });
}

export async function markPaymentPromised(customerId, data, supplierId) {
  const sid = supplierId || 1;
  await query(
    `INSERT INTO payments (customer_id, amount, promise_date, status, supplier_id)
     VALUES (?, 0, ?, ?, ?)`,
    [customerId, data.promiseDate, 'Promised', sid]
  );
  return { customerId, promiseDate: data.promiseDate };
}

// ─── Expenses ───────────────────────────────────────────────────

export async function getExpenses(month, year, supplierId) {
  const m = month ?? curMonth();
  const y = year ?? curYear();
  const tf = tenantWhere('', supplierId);
  const res = await query(
    `SELECT id, expense_date AS date, category AS type, amount, notes
     FROM expenses
     WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ? ${tf}
     ORDER BY expense_date DESC`, [m, y]
  );
  return res.rows.map((r) => ({
    id: r.id, date: fmtDate(r.date),
    type: r.type || 'Other', amount: Number(r.amount), notes: r.notes || '',
  }));
}

export async function createExpense(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const date = data.date || new Date().toISOString().slice(0, 10);
    await conn.query(
      `INSERT INTO expenses (expense_date, category, amount, notes, supplier_id) VALUES (?, ?, ?, ?, ?)`,
      [date, data.type || 'Other', Number(data.amount) || 0, data.notes || '', sid]
    );
    const res = await conn.query(
      `SELECT id, expense_date AS date, category AS type, amount, notes
       FROM expenses WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? { id: r.id, date: fmtDate(r.date), type: r.type || 'Other', amount: Number(r.amount), notes: r.notes || '' } : null;
  });
}

// ─── Salary ─────────────────────────────────────────────────────

export async function getSalaries(month, year, supplierId) {
  const m = month ?? curMonth();
  const y = year ?? curYear();
  const tf = tenantWhere('s.', supplierId);
  const res = await query(
    `SELECT s.id, s.user_id AS userId, u.full_name AS name, s.type,
       CASE WHEN s.type = 'Daily' THEN s.rate_per_day ELSE s.fixed_amount END AS rate,
       s.days_worked AS daysWorked, s.total_amount AS total,
       COALESCE(s.amount_paid, 0) AS amountPaid
     FROM salary s JOIN users u ON u.id = s.user_id
     WHERE s.period_month = ? AND s.period_year = ? ${tf}
     ORDER BY u.full_name`, [m, y]
  );
  return res.rows.map((r) => {
    const total = Number(r.total);
    const paid = Number(r.amountPaid ?? 0);
    const pending = Math.max(0, total - paid);
    return {
      id: r.id, userId: r.userId, name: r.name, type: r.type,
      rate: Number(r.rate), daysWorked: Number(r.daysWorked), total, amountPaid: paid, pending,
    };
  });
}

export async function getSalaryById(id, supplierId) {
  const tf = tenantWhere('s.', supplierId);
  const res = await query(
    `SELECT s.id, s.user_id AS userId, u.full_name AS name, s.period_month AS month, s.period_year AS year,
       s.type, s.days_worked AS daysWorked,
       CASE WHEN s.type = 'Daily' THEN s.rate_per_day ELSE s.fixed_amount END AS rate,
       s.total_amount AS total, COALESCE(s.amount_paid, 0) AS amountPaid
     FROM salary s JOIN users u ON u.id = s.user_id
     WHERE s.id = ? ${tf}`, [id]
  );
  const r = res.rows[0];
  if (!r) return null;
  const total = Number(r.total);
  const paid = Number(r.amountPaid ?? 0);
  return {
    id: r.id, userId: r.userId, name: r.name, month: Number(r.month), year: Number(r.year),
    type: r.type, rate: Number(r.rate), daysWorked: Number(r.daysWorked), total, amountPaid: paid, pending: Math.max(0, total - paid),
  };
}

export async function getSalaryMonthSummary(month, year, supplierId) {
  const list = await getSalaries(month, year, supplierId);
  const totalSalary = list.reduce((s, r) => s + r.total, 0);
  const totalPaid = list.reduce((s, r) => s + r.amountPaid, 0);
  const totalPending = list.reduce((s, r) => s + r.pending, 0);
  return { totalSalary, totalPaid, totalPending };
}

export async function createSalary(data, supplierId) {
  const sid = supplierId || 1;
  const type = data.type || 'Daily';
  const daysWorked = Number(data.daysWorked) || 0;
  const rate = Number(data.rate) || 0;
  const total = type === 'Daily' ? daysWorked * rate : rate;
  const ratePerDay = type === 'Daily' ? rate : null;
  const fixed = type === 'Monthly' ? rate : null;
  const month = data.month ?? curMonth();
  const year = data.year ?? curYear();

  return withConnection(async (conn) => {
    await conn.query(
      `INSERT INTO salary (user_id, period_month, period_year, type, days_worked, rate_per_day, fixed_amount, total_amount, amount_paid, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
      [data.userId, month, year, type, daysWorked, ratePerDay, fixed, total, sid]
    );
    const res = await conn.query(
      `SELECT s.id, s.user_id AS userId, u.full_name AS name, s.type,
         CASE WHEN s.type = 'Daily' THEN s.rate_per_day ELSE s.fixed_amount END AS rate,
         s.days_worked AS daysWorked, s.total_amount AS total, COALESCE(s.amount_paid, 0) AS amountPaid
       FROM salary s JOIN users u ON u.id = s.user_id
       WHERE s.id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    if (!r) return null;
    const totalNum = Number(r.total);
    const paidNum = Number(r.amountPaid ?? 0);
    return { id: r.id, userId: r.userId, name: r.name, type: r.type, rate: Number(r.rate), daysWorked: Number(r.daysWorked), total: totalNum, amountPaid: paidNum, pending: Math.max(0, totalNum - paidNum) };
  });
}

export async function updateSalary(id, data, supplierId) {
  const tf = tenantWhere('s.', supplierId);
  const existing = await query(`SELECT id, type, rate_per_day, fixed_amount, days_worked, total_amount, amount_paid FROM salary s WHERE s.id = ? ${tf}`, [id]);
  if (existing.rows.length === 0) return null;
  const row = existing.rows[0];
  let type = data.type !== undefined ? data.type : row.type;
  let rate = data.rate !== undefined ? Number(data.rate) : Number(row.rate_per_day || row.fixed_amount || 0);
  let daysWorked = data.daysWorked !== undefined ? Number(data.daysWorked) : Number(row.days_worked || 0);
  const month = data.month !== undefined ? Number(data.month) : null;
  const year = data.year !== undefined ? Number(data.year) : null;
  const amountPaid = data.amountPaid !== undefined ? Number(data.amountPaid) : null;

  const total = type === 'Daily' ? daysWorked * rate : rate;
  const ratePerDay = type === 'Daily' ? rate : null;
  const fixed = type === 'Monthly' ? rate : null;

  const updates = ['type = ?', 'days_worked = ?', 'rate_per_day = ?', 'fixed_amount = ?', 'total_amount = ?'];
  const vals = [type, daysWorked, ratePerDay, fixed, total];
  if (amountPaid !== null) { updates.push('amount_paid = ?'); vals.push(amountPaid); }
  if (month != null) { updates.push('period_month = ?'); vals.push(month); }
  if (year != null) { updates.push('period_year = ?'); vals.push(year); }
  vals.push(id);
  if (supplierId) { vals.push(supplierId); }
  await query(`UPDATE salary SET ${updates.join(', ')} WHERE id = ? ${supplierId ? 'AND supplier_id = ?' : ''}`, vals);
  return getSalaryById(id, supplierId);
}

export async function deleteSalary(id, supplierId) {
  const tf = tenantWhere('s.', supplierId);
  const params = [id];
  if (supplierId) params.push(supplierId);
  const res = await query(`DELETE FROM salary s WHERE s.id = ? ${tf}`, params);
  return res.affectedRows > 0;
}

export async function getDeliveryBoys(supplierId) {
  const tf = supplierId ? `AND business_id = ${Number(supplierId)}` : '';
  const res = await query(
    `SELECT id, full_name AS name FROM users WHERE role = 'delivery_boy' ${tf} ORDER BY full_name`
  );
  return res.rows;
}

// ─── Supplier Holidays ─────────────────────────────────────────

export async function getSupplierHolidays(supplierId) {
  const tf = tenantWhere('', supplierId);
  const res = await query(
    `SELECT id, holiday_date, COALESCE(end_date, holiday_date) AS end_date, reason
     FROM supplier_holidays WHERE 1=1 ${tf} ORDER BY holiday_date DESC`
  );
  return res.rows.map((r) => ({
    id: r.id, start: fmtDate(r.holiday_date), end: fmtDate(r.end_date), reason: r.reason || '',
  }));
}

export async function createSupplierHoliday(data, supplierId) {
  const sid = supplierId || 1;
  return withConnection(async (conn) => {
    const startDate = data.start || data.date;
    const endDate = data.end || startDate;
    await conn.query(
      `INSERT INTO supplier_holidays (holiday_date, end_date, reason, message_preview, supplier_id)
       VALUES (?, ?, ?, ?, ?)`,
      [startDate, endDate, data.reason || '', data.message || '', sid]
    );
    const res = await conn.query(
      `SELECT id, holiday_date, COALESCE(end_date, holiday_date) AS end_date, reason
       FROM supplier_holidays WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return r ? { id: r.id, start: fmtDate(r.holiday_date), end: fmtDate(r.end_date), reason: r.reason || '' } : null;
  });
}

export async function deleteSupplierHoliday(id, supplierId) {
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';
  await query(`DELETE FROM supplier_holidays WHERE id = ? ${tf}`, [id]);
  return true;
}

// ─── Jug Tracking ───────────────────────────────────────────────

export async function getJugTracking(supplierId) {
  const tf = tenantWhere('c.', supplierId);
  const res = await query(
    `SELECT c.id, c.full_name AS customer,
       COALESCE(SUM(d.jugs_out), 0) AS delivered,
       COALESCE(SUM(d.empty_in), 0) AS collected,
       COALESCE(SUM(d.jugs_out), 0) - COALESCE(SUM(d.empty_in), 0) AS pending
     FROM customers c
     LEFT JOIN deliveries d ON d.customer_id = c.id
     WHERE c.active = 1 ${tf}
     GROUP BY c.id, c.full_name
     ORDER BY pending DESC`
  );
  return res.rows.map((r) => ({
    id: r.id, customer: r.customer,
    delivered: Number(r.delivered), collected: Number(r.collected), pending: Number(r.pending),
  }));
}

// ─── Profit Summary ─────────────────────────────────────────────

export async function getProfitSummary(month, year, supplierId) {
  const m = month ?? curMonth();
  const y = year ?? curYear();
  const tf = supplierId ? `AND supplier_id = ${Number(supplierId)}` : '';

  const [billingRes, spotRes, eventRes, fuelRes, otherRes, salaryRes] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(COALESCE(final_amount, total_amount)), 0) AS total
       FROM invoices i JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
       WHERE bc.cycle_month = ? AND bc.cycle_year = ? ${tf.replace('supplier_id', 'i.supplier_id')}`, [m, y]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM spot_supply
       WHERE MONTH(supply_date) = ? AND YEAR(supply_date) = ? ${tf}`, [m, y]
    ),
    query(
      `SELECT COALESCE(SUM(es.jugs_out * e.rate_per_jug), 0) AS total
       FROM events e JOIN event_supply es ON es.event_id = e.id
       WHERE e.status = 'Closed' AND MONTH(e.end_date) = ? AND YEAR(e.end_date) = ? ${tf.replace('supplier_id', 'e.supplier_id')}`, [m, y]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE category = 'Fuel' AND MONTH(expense_date) = ? AND YEAR(expense_date) = ? ${tf}`, [m, y]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE (category IS NULL OR category != 'Fuel') AND MONTH(expense_date) = ? AND YEAR(expense_date) = ? ${tf}`, [m, y]
    ),
    query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total FROM salary
       WHERE period_month = ? AND period_year = ? ${tf}`, [m, y]
    ),
  ]);

  const customerBilling = Number(billingRes.rows[0]?.total ?? 0);
  const spotRevenue = Number(spotRes.rows[0]?.total ?? 0);
  const eventRevenue = Number(eventRes.rows[0]?.total ?? 0);
  const fuel = Number(fuelRes.rows[0]?.total ?? 0);
  const other = Number(otherRes.rows[0]?.total ?? 0);
  const salaries = Number(salaryRes.rows[0]?.total ?? 0);

  const billing = customerBilling + spotRevenue + eventRevenue;
  const expenses = fuel + other;
  const net = billing - expenses - salaries;

  return {
    billing, expenses, salaries, net,
    breakdown: [
      { label: 'Customer Billing (Monthly)', amount: customerBilling },
      { label: 'Spot Supply Revenue', amount: spotRevenue },
      { label: 'Event Revenue', amount: eventRevenue },
      { label: 'Fuel Expenses', amount: -fuel },
      { label: 'Other Expenses', amount: -other },
      { label: 'Delivery Boy Salaries', amount: -salaries },
    ],
  };
}

// ─── Delivery Boy ────────────────────────────────────────────────

export async function getDeliveryBoyToday(deliveryBoyId) {
  const today = new Date().toISOString().slice(0, 10);

  const [delRes, holRes] = await Promise.all([
    query(
      `SELECT d.id, d.delivery_date AS date, c.id AS customerId, c.full_name AS customer,
         c.address, c.pending_jugs AS pendingJugs, c.rate_per_jug AS ratePerJug,
         d.jugs_out AS jugsOut, d.empty_in AS emptyIn, d.payment_status AS payment, d.notes
       FROM deliveries d
       LEFT JOIN customers c ON c.id = d.customer_id
       WHERE d.delivery_boy_id = ? AND d.delivery_date = ?
       ORDER BY d.id ASC`,
      [deliveryBoyId, today]
    ),
    query(
      `SELECT id, holiday_date, end_date, reason FROM supplier_holidays
       WHERE holiday_date <= ? AND (end_date >= ? OR end_date IS NULL)`,
      [today, today]
    ),
  ]);

  const deliveries = delRes.rows.map((r) => ({
    ...r,
    date: fmtDate(r.date),
    pendingJugs: Number(r.pendingJugs || 0),
    ratePerJug: Number(r.ratePerJug || 0),
    jugsOut: Number(r.jugsOut || 0),
    emptyIn: Number(r.emptyIn || 0),
    confirmed: (Number(r.jugsOut) > 0 || Number(r.emptyIn) > 0),
  }));

  const completed = deliveries.filter((d) => d.confirmed);
  const pending = deliveries.filter((d) => !d.confirmed);
  const holiday = holRes.rows[0] || null;

  return {
    date: fmtDate(today),
    supplierHoliday: holiday ? { reason: holiday.reason, date: fmtDate(holiday.holiday_date) } : null,
    summary: {
      total: deliveries.length,
      completed: completed.length,
      pending: pending.length,
      jugsOut: deliveries.reduce((s, d) => s + d.jugsOut, 0),
      emptyCollected: deliveries.reduce((s, d) => s + d.emptyIn, 0),
    },
    deliveries,
  };
}

export async function confirmDeliveryByBoy(deliveryBoyId, data) {
  return withConnection(async (conn) => {
    const { deliveryId, jugsOut, emptyIn, paymentCollected, paymentMode, remarks } = data;
    const jugsOutN = Number(jugsOut) || 0;
    const emptyInN = Number(emptyIn) || 0;

    const ownerRes = await conn.query(
      'SELECT id, customer_id FROM deliveries WHERE id = ? AND delivery_boy_id = ?',
      [deliveryId, deliveryBoyId]
    );
    if (ownerRes.rows.length === 0) {
      return { error: 'Delivery not found or not assigned to you', status: 403 };
    }

    const today = new Date().toISOString().slice(0, 10);
    const holRes = await conn.query(
      `SELECT reason FROM supplier_holidays
       WHERE holiday_date <= ? AND (end_date >= ? OR end_date IS NULL)`,
      [today, today]
    );
    if (holRes.rows.length > 0) {
      return {
        error: 'Supplier holiday active',
        reason: holRes.rows[0].reason,
        holidayDate: fmtDate(today),
        status: 409,
      };
    }

    const customerId = ownerRes.rows[0].customer_id;
    const paymentStatus = paymentCollected ? (paymentMode || 'Cash') : 'Pending';

    await conn.query(
      `UPDATE deliveries SET jugs_out = ?, empty_in = ?, payment_status = ?, notes = ? WHERE id = ?`,
      [jugsOutN, emptyInN, paymentStatus, remarks || null, deliveryId]
    );

    const net = jugsOutN - emptyInN;
    let previousPending = 0;

    if (customerId) {
      const custRes = await conn.query('SELECT pending_jugs, rate_per_jug FROM customers WHERE id = ?', [customerId]);
      const cust = custRes.rows[0];
      previousPending = Number(cust?.pending_jugs || 0);
      const rate = Number(cust?.rate_per_jug || 0);

      if (net !== 0) {
        await conn.query('UPDATE customers SET pending_jugs = pending_jugs + ? WHERE id = ?', [net, customerId]);
      }

      if (paymentCollected && rate > 0 && jugsOutN > 0) {
        const payAmount = rate * jugsOutN;
        await conn.query(
          `INSERT INTO payments (invoice_id, customer_id, amount, payment_date, mode, status)
           VALUES (NULL, ?, ?, ?, ?, ?)`,
          [customerId, payAmount, today, paymentMode || 'Cash', 'Received']
        );
        await conn.query(
          'UPDATE customers SET outstanding = outstanding - ? WHERE id = ?',
          [payAmount, customerId]
        );
      }
    }

    const resultRes = await conn.query(
      `SELECT d.id, c.full_name AS customer, d.jugs_out AS jugsOut, d.empty_in AS emptyIn,
         d.payment_status AS payment
       FROM deliveries d LEFT JOIN customers c ON c.id = d.customer_id
       WHERE d.id = ?`,
      [deliveryId]
    );

    const r = resultRes.rows[0];
    return {
      success: true,
      delivery: {
        id: r?.id,
        customer: r?.customer,
        jugsOut: Number(r?.jugsOut || 0),
        emptyIn: Number(r?.emptyIn || 0),
        payment: r?.payment,
        confirmedAt: new Date().toISOString(),
      },
      jugBalance: {
        previousPending,
        netChange: net,
        newPending: previousPending + net,
      },
    };
  });
}

export async function createSpotSupplyByBoy(deliveryBoyId, data) {
  return withConnection(async (conn) => {
    const date = new Date().toISOString().slice(0, 10);
    const location = data.location || '';
    const jugs = Number(data.jugs) || 0;
    const amount = Number(data.amount) || 0;
    const mode = data.paymentMode || data.mode || 'Pending';
    const notes = data.notes || '';

    if (!location.trim()) return { error: 'Location is required', status: 400 };
    if (jugs <= 0) return { error: 'Jugs must be a positive number', status: 400 };

    await conn.query(
      `INSERT INTO spot_supply (supply_date, delivery_boy_id, location_name, jugs_given, amount, payment_mode, internal_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [date, deliveryBoyId, location, jugs, amount, mode, notes]
    );

    const res = await conn.query(
      `SELECT id, supply_date AS date, location_name AS location,
         jugs_given AS jugs, amount, payment_mode AS paymentMode, internal_notes AS notes
       FROM spot_supply WHERE id = LAST_INSERT_ID()`
    );
    const r = res.rows[0];
    return {
      success: true,
      spotSupply: r ? {
        id: r.id, date: fmtDate(r.date), location: r.location,
        jugs: Number(r.jugs), amount: Number(r.amount), paymentMode: r.paymentMode,
      } : null,
    };
  });
}

// ─── Client Portal ───────────────────────────────────────────────

export async function getClientDashboard(customerId) {
  const today = new Date().toISOString().slice(0, 10);
  const m = curMonth();
  const y = curYear();

  const [custRes, billRes, lastDelRes, recentRes, holRes] = await Promise.all([
    query('SELECT full_name, pending_jugs, outstanding FROM customers WHERE id = ?', [customerId]),
    query(
      `SELECT COALESCE(i.final_amount, i.total_amount) AS bill
       FROM invoices i JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
       WHERE i.customer_id = ? AND bc.cycle_month = ? AND bc.cycle_year = ?`,
      [customerId, m, y]
    ),
    query(
      'SELECT delivery_date FROM deliveries WHERE customer_id = ? ORDER BY delivery_date DESC LIMIT 1',
      [customerId]
    ),
    query(
      `SELECT delivery_date AS date, jugs_out AS jugsDelivered, empty_in AS emptyCollected
       FROM deliveries WHERE customer_id = ? ORDER BY delivery_date DESC, id DESC LIMIT 10`,
      [customerId]
    ),
    query(
      `SELECT holiday_date, end_date, reason FROM supplier_holidays
       WHERE COALESCE(end_date, holiday_date) >= ? ORDER BY holiday_date ASC LIMIT 1`,
      [today]
    ),
  ]);

  const cust = custRes.rows[0];
  const holiday = holRes.rows[0];

  return {
    company: cust?.full_name || '',
    currentMonthBill: Number(billRes.rows[0]?.bill ?? 0),
    outstanding: Number(cust?.outstanding ?? 0),
    pendingJugs: Number(cust?.pending_jugs ?? 0),
    lastDeliveryDate: lastDelRes.rows[0] ? fmtDate(lastDelRes.rows[0].delivery_date) : '—',
    holidayNotice: holiday ? {
      reason: holiday.reason,
      dates: fmtDateRange(holiday.holiday_date, holiday.end_date),
    } : null,
    recentDeliveries: recentRes.rows.map((r) => ({
      date: fmtDate(r.date),
      jugsDelivered: Number(r.jugsDelivered),
      emptyCollected: Number(r.emptyCollected),
    })),
  };
}

export async function getClientBilling(customerId, year) {
  const y = year ?? curYear();

  const res = await query(
    `SELECT i.id, bc.cycle_month AS month, bc.cycle_year AS year,
       i.chargeable_days, i.rate_per_jug,
       COALESCE(i.discount, 0) AS discount,
       COALESCE(i.additional_charges, 0) AS additional_charges,
       COALESCE(i.final_amount, i.total_amount) AS final_amount,
       i.status
     FROM invoices i
     JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
     WHERE i.customer_id = ? AND bc.cycle_year = ?
     ORDER BY bc.cycle_month DESC`,
    [customerId, y]
  );

  const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

  const invoiceIds = res.rows.map((r) => r.id);
  let paidMap = {};
  if (invoiceIds.length > 0) {
    const placeholders = invoiceIds.map(() => '?').join(',');
    const payRes = await query(
      `SELECT invoice_id, COALESCE(SUM(amount), 0) AS paid
       FROM payments WHERE invoice_id IN (${placeholders}) AND status = 'Received'
       GROUP BY invoice_id`,
      invoiceIds
    );
    for (const r of payRes.rows) {
      paidMap[r.invoice_id] = Number(r.paid);
    }
  }

  return {
    invoices: res.rows.map((r) => {
      const finalAmt = Number(r.final_amount);
      const paid = paidMap[r.id] || 0;
      return {
        id: r.id,
        month: `${MONTH_NAMES[r.month]} ${r.year}`,
        chargeableDays: Number(r.chargeable_days),
        rate: Number(r.rate_per_jug),
        discount: Number(r.discount),
        additionalCharges: Number(r.additional_charges),
        finalAmount: finalAmt,
        status: paid >= finalAmt ? 'Paid' : 'Pending',
      };
    }),
  };
}

export async function getClientDeliveries(customerId, range, from, to) {
  let dateFilter;
  const params = [customerId];

  if (from && to) {
    dateFilter = 'AND d.delivery_date BETWEEN ? AND ?';
    params.push(from, to);
  } else if (range === 'last_month') {
    dateFilter = "AND d.delivery_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01') AND d.delivery_date < DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  } else {
    dateFilter = "AND d.delivery_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  }

  const res = await query(
    `SELECT d.delivery_date AS date, d.jugs_out AS jugsDelivered,
       d.empty_in AS emptyCollected, d.payment_status AS paymentStatus
     FROM deliveries d
     WHERE d.customer_id = ? ${dateFilter}
     ORDER BY d.delivery_date DESC, d.id DESC`,
    params
  );

  const rows = res.rows.map((r) => ({
    date: fmtDate(r.date),
    jugsDelivered: Number(r.jugsDelivered),
    emptyCollected: Number(r.emptyCollected),
    paymentStatus: r.paymentStatus,
  }));

  return {
    range: (from && to) ? 'custom' : (range || 'month'),
    deliveries: rows,
    totals: {
      totalDelivered: rows.reduce((s, r) => s + r.jugsDelivered, 0),
      totalEmpty: rows.reduce((s, r) => s + r.emptyCollected, 0),
      count: rows.length,
    },
  };
}

export async function getClientInvoice(customerId, invoiceId) {
  const res = await query(
    `SELECT i.id, c.full_name AS customerName, c.address,
       bc.cycle_month, bc.cycle_year,
       i.total_days, i.supplier_hol_days, i.client_hol_days,
       i.chargeable_days, i.rate_per_jug,
       i.total_amount AS baseAmount,
       COALESCE(i.discount, 0) AS discount,
       COALESCE(i.additional_charges, 0) AS additionalCharges,
       COALESCE(i.final_amount, i.total_amount) AS finalAmount,
       i.status
     FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     JOIN billing_cycles bc ON bc.id = i.billing_cycle_id
     WHERE i.id = ? AND i.customer_id = ?`,
    [invoiceId, customerId]
  );

  const r = res.rows[0];
  if (!r) return null;

  const MONTH_NAMES = ['','January','February','March','April','May','June','July','August','September','October','November','December'];

  return {
    invoiceId: r.id, customerName: r.customerName, address: r.address,
    month: `${MONTH_NAMES[r.cycle_month]} ${r.cycle_year}`,
    totalDays: Number(r.total_days), supplierHolidays: Number(r.supplier_hol_days),
    clientHolidays: Number(r.client_hol_days), chargeableDays: Number(r.chargeable_days),
    ratePerJug: Number(r.rate_per_jug), baseAmount: Number(r.baseAmount),
    discount: Number(r.discount), additionalCharges: Number(r.additionalCharges),
    finalAmount: Number(r.finalAmount), status: r.status,
  };
}

export async function createClientIssue(customerId, data) {
  const { subject, description } = data;
  await query(
    'INSERT INTO issues (customer_id, subject, description) VALUES (?, ?, ?)',
    [customerId, subject, description || '']
  );
  const res = await query(
    'SELECT id, subject, status, created_at FROM issues WHERE customer_id = ? ORDER BY id DESC LIMIT 1',
    [customerId]
  );
  const r = res.rows[0];
  return r ? { id: r.id, subject: r.subject, status: r.status, createdAt: fmtDate(r.created_at) } : null;
}

export async function getClientIssues(customerId) {
  const res = await query(
    'SELECT id, subject, status, created_at, resolved_at FROM issues WHERE customer_id = ? ORDER BY created_at DESC',
    [customerId]
  );
  return res.rows.map((r) => ({
    id: r.id, subject: r.subject, status: r.status,
    createdAt: fmtDate(r.created_at),
    resolvedAt: r.resolved_at ? fmtDate(r.resolved_at) : null,
  }));
}

// ─── Delivery Boy History ─────────────────────────────────────────

export async function getDeliveryBoyHistory(deliveryBoyId, range = 'today') {
  let dateFilter;
  if (range === 'week') dateFilter = 'AND d.delivery_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  else if (range === 'month') dateFilter = "AND d.delivery_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  else dateFilter = 'AND d.delivery_date = CURDATE()';

  let spotDateFilter;
  if (range === 'week') spotDateFilter = 'AND s.supply_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  else if (range === 'month') spotDateFilter = "AND s.supply_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')";
  else spotDateFilter = 'AND s.supply_date = CURDATE()';

  const [delRes, spotRes] = await Promise.all([
    query(
      `SELECT d.id, 'Delivery' AS type, d.delivery_date AS date, c.full_name AS customer,
         d.jugs_out AS jugsOut, d.empty_in AS emptyIn, d.payment_status AS payment
       FROM deliveries d
       LEFT JOIN customers c ON c.id = d.customer_id
       WHERE d.delivery_boy_id = ? ${dateFilter}
       ORDER BY d.delivery_date DESC, d.id DESC`,
      [deliveryBoyId]
    ),
    query(
      `SELECT s.id, 'Spot' AS type, s.supply_date AS date, s.location_name AS customer,
         s.jugs_given AS jugsOut, 0 AS emptyIn, s.payment_mode AS payment
       FROM spot_supply s
       WHERE s.delivery_boy_id = ? ${spotDateFilter}
       ORDER BY s.supply_date DESC, s.id DESC`,
      [deliveryBoyId]
    ),
  ]);

  const records = [
    ...delRes.rows.map((r) => ({ ...r, date: fmtDate(r.date), jugsOut: Number(r.jugsOut), emptyIn: Number(r.emptyIn) })),
    ...spotRes.rows.map((r) => ({ ...r, date: fmtDate(r.date), jugsOut: Number(r.jugsOut), emptyIn: 0 })),
  ].sort((a, b) => (b.id || 0) - (a.id || 0));

  return {
    range,
    records,
    totals: {
      deliveries: delRes.rows.length,
      spotSupplies: spotRes.rows.length,
      totalJugs: records.reduce((s, r) => s + r.jugsOut, 0),
      totalEmpty: records.reduce((s, r) => s + r.emptyIn, 0),
    },
  };
}
