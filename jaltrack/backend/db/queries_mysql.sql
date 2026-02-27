-- ============================================================
-- Jaltrack – MySQL queries
-- ============================================================
-- IMPORTANT: Run schema-mysql.sql FIRST to create tables.
-- See 00_RUN_THIS_FIRST.md for steps.
-- ============================================================
-- Do NOT add LIMIT to COUNT(*) – it returns one row already.
-- ============================================================

-- ---------- 2. DASHBOARD ----------
-- Today's delivery count (set @today := '2024-02-26';)
SELECT COUNT(*) AS cnt FROM deliveries WHERE delivery_date = CURDATE();

SELECT COALESCE(SUM(jugs_given), 0) AS total FROM spot_supply WHERE supply_date = CURDATE();

SELECT COALESCE(SUM(jugs_out), 0) - COALESCE(SUM(empty_in), 0) AS pending FROM deliveries;

SELECT COALESCE(SUM(c.outstanding), 0) AS total FROM customers c WHERE c.active = 1;

SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_date = CURDATE();

SELECT id, activity_date AS dateTime, type, customer_or_location AS customer, amount_or_jugs AS amount, status
FROM activity_log ORDER BY activity_date DESC LIMIT 20;


-- ---------- 3. CUSTOMERS ----------
SELECT id, full_name AS fullName, phone, address, rate_per_jug AS ratePerJug,
       joining_date AS joiningDate, holiday_billing_chargeable AS holidayBillingChargeable,
       pending_jugs AS pendingJugs, outstanding
FROM customers WHERE active = 1 ORDER BY full_name;

-- INSERT (replace values): INSERT INTO customers (full_name, phone, address, rate_per_jug, joining_date, holiday_billing_chargeable) VALUES ('Name', '+91 99999 00000', 'Address', 35, '2024-01-15', 1);

SELECT COALESCE(SUM(jugs_out), 0) AS total FROM deliveries;
SELECT COALESCE(SUM(outstanding), 0) AS total FROM customers WHERE active = 1;
SELECT COUNT(*) AS cnt FROM customers WHERE joining_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01');


-- ---------- 4. DELIVERIES ----------
SELECT d.id, d.delivery_date, c.full_name AS customer, d.jugs_out AS jugsOut, d.empty_in AS emptyIn,
       d.payment_status AS payment, u.full_name AS agent
FROM deliveries d
LEFT JOIN customers c ON c.id = d.customer_id
LEFT JOIN users u ON u.id = d.delivery_boy_id
ORDER BY d.delivery_date DESC, d.id DESC LIMIT 24;

SELECT COALESCE(SUM(jugs_out), 0) AS total FROM deliveries WHERE delivery_date = CURDATE();
SELECT COALESCE(SUM(jugs_out), 0) - COALESCE(SUM(empty_in), 0) AS pending FROM deliveries;

-- INSERT spot supply: INSERT INTO spot_supply (supply_date, location_name, jugs_given, amount, payment_mode, internal_notes) VALUES (CURDATE(), 'Location', 10, 500, 'Cash', 'Notes');


-- ---------- 5. BILLING ----------
-- Set month/year: e.g. October 2024 -> 10, 2024
SELECT i.id, c.full_name AS customer, i.total_days AS totalDays, i.supplier_hol_days AS supplierHol,
       i.client_hol_days AS clientHol, i.chargeable_days AS chargeable, i.rate_per_jug AS rate, i.total_amount AS total
FROM invoices i
JOIN customers c ON c.id = i.customer_id
JOIN billing_cycles bc ON bc.id = i.billing_cycle_id AND bc.cycle_month = MONTH(CURDATE()) AND bc.cycle_year = YEAR(CURDATE())
ORDER BY c.full_name;


-- ---------- 6. SUPPLIER HOLIDAYS ----------
SELECT id, holiday_date, reason, message_preview AS messagePreview
FROM supplier_holidays ORDER BY holiday_date DESC;

-- INSERT: INSERT INTO supplier_holidays (holiday_date, reason, message_preview) VALUES ('2024-11-01', 'Diwali', 'Message');
-- DELETE: DELETE FROM supplier_holidays WHERE id = 1;


-- ---------- 7. AD-HOC ----------
SELECT c.id, c.full_name,
       COALESCE(SUM(d.jugs_out), 0) - COALESCE(SUM(d.empty_in), 0) AS pending_jugs
FROM customers c
LEFT JOIN deliveries d ON d.customer_id = c.id
WHERE c.active = 1
GROUP BY c.id, c.full_name;

SELECT
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) AS total_billing,
  (SELECT COALESCE(SUM(amount), 0) FROM expenses) AS total_expenses,
  (SELECT COALESCE(SUM(total_amount), 0) FROM salary) AS total_salaries,
  (SELECT COALESCE(SUM(total_amount), 0) FROM invoices) - (SELECT COALESCE(SUM(amount), 0) FROM expenses) - (SELECT COALESCE(SUM(total_amount), 0) FROM salary) AS net_profit;

SELECT p.id, p.amount, p.promise_date, p.payment_date, i.customer_id
FROM payments p
LEFT JOIN invoices i ON i.id = p.invoice_id
WHERE p.promise_date IS NOT NULL
ORDER BY p.promise_date;
