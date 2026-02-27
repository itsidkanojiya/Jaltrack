import 'dotenv/config';
import pg from 'pg';
import mysql from 'mysql2/promise';

const { Pool: PgPool } = pg;

const useMySQL = !!process.env.DB_NAME;

let pgPool = null;
let mysqlPool = null;

if (useMySQL && process.env.DB_HOST) {
  mysqlPool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
} else if (process.env.DATABASE_URL) {
  pgPool = new PgPool({ connectionString: process.env.DATABASE_URL });
}

export async function query(text, params) {
  if (useMySQL && mysqlPool) {
    const sql = text.replace(/\$\d+/g, '?');
    const [rows] = await mysqlPool.execute(sql, params || []);
    return { rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 };
  }
  if (pgPool) {
    return pgPool.query(text, params);
  }
  return { rows: [], rowCount: 0 };
}

export async function withConnection(fn) {
  if (useMySQL && mysqlPool) {
    const conn = await mysqlPool.getConnection();
    try {
      return await fn({
        query: async (sql, params) => {
          const s = sql.replace(/\$\d+/g, '?');
          const [rows] = await conn.execute(s, params || []);
          return { rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 };
        },
      });
    } finally {
      conn.release();
    }
  }
  return fn({ query: (t, p) => query(t, p) });
}

export async function testConnection() {
  try {
    if (useMySQL && mysqlPool) {
      const conn = await mysqlPool.getConnection();
      conn.release();
      return { ok: true, type: 'MySQL', host: process.env.DB_HOST, db: process.env.DB_NAME };
    }
    if (pgPool) {
      await pgPool.query('SELECT 1');
      return { ok: true, type: 'PostgreSQL', host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown' };
    }
    return { ok: false, error: 'No database configured' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function getPool() {
  return useMySQL ? mysqlPool : pgPool;
}
