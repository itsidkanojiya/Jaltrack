# Run this first – create tables

The queries in `queries_mysql.sql` need the **tables** to exist. Do this once:

## Option A: phpMyAdmin

1. Log in to phpMyAdmin.
2. Click your database in the left sidebar (e.g. `u775282728_waterjug`).
3. Open the **Import** or **SQL** tab.
4. Either:
   - **Import** the file `schema-mysql.sql`, or  
   - Copy the entire contents of `schema-mysql.sql`, paste into the SQL box, and click **Go**.

All tables (`users`, `customers`, `deliveries`, `spot_supply`, `supplier_holidays`, etc.) will be created.

## Option B: MySQL command line

```bash
mysql -h YOUR_HOST -u u775282728_waterjug -p u775282728_waterjug < schema-mysql.sql
```

Enter your password when prompted. Replace `YOUR_HOST` with your MySQL server (e.g. `localhost` or your hosting hostname).

---

After that, you can run queries like:

```sql
SELECT COUNT(*) AS cnt FROM deliveries WHERE delivery_date = CURDATE();
```

**Note:** Do **not** add `LIMIT 0, 25` to a `COUNT(*)` query. `COUNT(*)` already returns one row; `LIMIT` is for multi-row results (e.g. `SELECT * FROM deliveries LIMIT 0, 25`).
