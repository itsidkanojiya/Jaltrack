# Jaltrack

Water Jug Management System – React (web) admin + Node.js API + PostgreSQL.

## Structure

- **`frontend/`** – React admin UI (Vite): Dashboard, Customers, Deliveries, Billing & Holidays
- **`backend/`** – Node.js API (Express), optional PostgreSQL
- **`backend/db/schema.sql`** – PostgreSQL schema and tables
- **`backend/db/queries.js`** – Database queries used by API

## Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

Runs at **http://localhost:3001**. Works without a database (mock data). For real data, set `DATABASE_URL` and run the schema.

### Database (MySQL)

1. Create the database and user in your MySQL panel (e.g. `u775282728_waterjug`).
2. Copy `backend/.env.example` to `backend/.env` and set:
   - `DB_HOST` (use your MySQL server hostname if not localhost)
   - `DB_PORT=3306`
   - `DB_USER`, `DB_PASSWORD`, `DB_NAME`
3. Run the MySQL schema:  
   `mysql -h DB_HOST -u DB_USER -p DB_NAME < backend/db/schema-mysql.sql`  
   Or import `backend/db/schema-mysql.sql` via phpMyAdmin / your panel.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at **http://localhost:5173**. Proxies `/api` to the backend.

## Admin screens (Stitch-aligned)

1. **Dashboard** – Today’s deliveries, spot supply, pending jugs, outstanding, cash collected, recent activity, efficiency.
2. **Customers** – List, add customer (name, phone, address, rate, joining date, holiday billing), stats.
3. **Deliveries** – Daily log, spot supply form (location, jugs, amount, payment mode), stats.
4. **Billing & Holidays** – Monthly billing table (customer, days, supplier/client hol, chargeable, rate, total), supplier holiday management, billing rule reminder (supplier hol = not billable, client hol = billable).

## API

- `GET /api/health` – Health check
- `GET /api/dashboard/stats`, `GET /api/dashboard/activity`
- `GET/POST /api/customers`, `GET /api/customers/stats`
- `GET /api/deliveries/recent`, `GET /api/deliveries/stats`, `POST /api/deliveries/spot`
- `GET /api/billing/invoices`
- `GET /api/holidays`, `POST /api/holidays`, `DELETE /api/holidays/:id`

## Stitch assets

Screenshots saved under `frontend/public/stitch-screenshots/`. HTML was used to build the React UI.
