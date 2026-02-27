# Jaltrack – Database SQL Reference

Use this with **MySQL**. For the full schema to create tables, run `schema-mysql.sql`.

---

## 1. Schema (create tables)

See **`schema-mysql.sql`** for the complete DDL. Summary of tables:

| Table | Purpose |
|-------|---------|
| `users` | Admin, delivery boys |
| `customers` | Subscribers (name, phone, rate, joining_date, holiday_billing_chargeable, outstanding) |
| `supplier_holidays` | Supplier holidays (not billable) |
| `client_holidays` | Client holidays (billable continues) |
| `deliveries` | Regular route deliveries (jugs_out, empty_in, payment_status) |
| `spot_supply` | Non-contract spot supply |
| `billing_cycles` | Month/year billing cycle |
| `invoices` | Per-customer monthly invoice (chargeable_days, rate, total) |
| `payments` | Payments (amount, payment_date, promise_date) |
| `expenses` | Expenses |
| `salary` | Delivery boy salary (daily/monthly) |
| `activity_log` | Dashboard recent activity |

---

## 2. Dashboard

### Today’s delivery count
```sql
-- Param: today (e.g. '2024-02-26')
SELECT COUNT(*) AS cnt FROM deliveries WHERE delivery_date = ?;
```

### Today’s spot supply jugs
```sql
SELECT COALESCE(SUM(jugs_given), 0) AS total FROM spot_supply WHERE supply_date = ?;
```

### Pending empty jugs (Delivered - Empty collected)
```sql
SELECT COALESCE(SUM(jugs_out), 0) - COALESCE(SUM(empty_in), 0) AS pending FROM deliveries;
```

### Total outstanding (customers)
```sql
SELECT COALESCE(SUM(c.outstanding), 0) AS total FROM customers c WHERE c.active = 1;
```

### Cash collected today
```sql
SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_date = ?;
```

### Recent activity
```sql
SELECT id, activity_date AS dateTime, type, customer_or_location AS customer, amount_or_jugs AS amount, status
FROM activity_log ORDER BY activity_date DESC LIMIT ?;
-- Param: limit (e.g. 20)
```

---

## 3. Customers

### List active customers
```sql
SELECT id, full_name AS fullName, phone, address, rate_per_jug AS ratePerJug,
       joining_date AS joiningDate, holiday_billing_chargeable AS holidayBillingChargeable,
       pending_jugs AS pendingJugs, outstanding
FROM customers WHERE active = 1 ORDER BY full_name;
```

### Insert customer
```sql
INSERT INTO customers (full_name, phone, address, rate_per_jug, joining_date, holiday_billing_chargeable)
VALUES (?, ?, ?, ?, ?, ?);
-- Params: fullName, phone, address, ratePerJug, joiningDate, holidayBillingChargeable (1/0)
```

### Customer stats – total jugs delivered
```sql
SELECT COALESCE(SUM(jugs_out), 0) AS total FROM deliveries;
```

### Customer stats – total outstanding
```sql
SELECT COALESCE(SUM(outstanding), 0) AS total FROM customers WHERE active = 1;
```

### Customer stats – new customers this month
```sql
SELECT COUNT(*) AS cnt FROM customers WHERE joining_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01');
```

---

## 4. Deliveries

### Recent deliveries
```sql
SELECT d.id, d.delivery_date, c.full_name AS customer, d.jugs_out AS jugsOut, d.empty_in AS emptyIn,
       d.payment_status AS payment, u.full_name AS agent
FROM deliveries d
LEFT JOIN customers c ON c.id = d.customer_id
LEFT JOIN users u ON u.id = d.delivery_boy_id
ORDER BY d.delivery_date DESC, d.id DESC LIMIT ?;
```

### Delivery stats – jugs today
```sql
SELECT COALESCE(SUM(jugs_out), 0) AS total FROM deliveries WHERE delivery_date = ?;
```

### Delivery stats – empty jugs pending
```sql
SELECT COALESCE(SUM(jugs_out), 0) - COALESCE(SUM(empty_in), 0) AS pending FROM deliveries;
```

### Insert spot supply
```sql
INSERT INTO spot_supply (supply_date, location_name, jugs_given, amount, payment_mode, internal_notes)
VALUES (?, ?, ?, ?, ?, ?);
-- Params: supply_date, location_name, jugs_given, amount, payment_mode, internal_notes
```

---

## 5. Billing

### Invoices for a month
```sql
SELECT i.id, c.full_name AS customer, i.total_days AS totalDays, i.supplier_hol_days AS supplierHol,
       i.client_hol_days AS clientHol, i.chargeable_days AS chargeable, i.rate_per_jug AS rate, i.total_amount AS total
FROM invoices i
JOIN customers c ON c.id = i.customer_id
JOIN billing_cycles bc ON bc.id = i.billing_cycle_id AND bc.cycle_month = ? AND bc.cycle_year = ?
ORDER BY c.full_name;
-- Params: cycle_month (1–12), cycle_year
```

---

## 6. Supplier holidays

### List holidays
```sql
SELECT id, holiday_date, reason, message_preview AS messagePreview
FROM supplier_holidays ORDER BY holiday_date DESC;
```

### Insert holiday
```sql
INSERT INTO supplier_holidays (holiday_date, reason, message_preview) VALUES (?, ?, ?);
-- Params: holiday_date, reason, message_preview
```

### Delete holiday
```sql
DELETE FROM supplier_holidays WHERE id = ?;
```

---

## 7. Useful ad‑hoc queries

### Jug balance per customer (delivered - empty collected)
```sql
SELECT c.id, c.full_name,
       COALESCE(SUM(d.jugs_out), 0) - COALESCE(SUM(d.empty_in), 0) AS pending_jugs
FROM customers c
LEFT JOIN deliveries d ON d.customer_id = c.id
WHERE c.active = 1
GROUP BY c.id, c.full_name;
```

### Profit summary (billing - expenses - salaries)
```sql
SELECT
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) AS total_billing,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses,
  (SELECT COALESCE(SUM(total_amount), 0) FROM salary) AS total_salaries,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) - (SELECT COALESCE(SUM(amount), 0) FROM expenses) - (SELECT COALESCE(SUM(total_amount), 0) FROM salary) AS net_profit;
```

### Payments with promise date (reminders)
```sql
SELECT p.id, p.amount, p.promise_date, p.payment_date, i.customer_id
FROM payments p
LEFT JOIN invoices i ON i.id = p.invoice_id
WHERE p.promise_date IS NOT NULL
ORDER BY p.promise_date;
```
