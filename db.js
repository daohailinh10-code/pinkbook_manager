import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

export async function openDb({
  url = process.env.DATABASE_URL,
  dir = process.env.DATA_DIR || "./data/db",
} = {}) {
  if (url) {
    const pool = new pg.Pool({
      connectionString: url,
      options: "-c timezone=Asia/Ho_Chi_Minh",
    });

    return {
      query: (s, p = []) => pool.query(s, p),
      exec: (s) => pool.query(s),
      close: () => pool.end(),
      transaction: async (fn) => {
        const c = await pool.connect();
        try {
          await c.query("BEGIN");
          // Khóa giao dịch đồng thời (sử dụng mã định danh nhóm 31 của dự án)
          await c.query("SELECT pg_advisory_xact_lock(310031)");
          const r = await fn(c);
          await c.query("COMMIT");
          return r;
        } catch (e) {
          await c.query("ROLLBACK");
          throw e;
        } finally {
          c.release();
        }
      },
    };
  }

  // Sử dụng PGlite (PostgreSQL nhúng) khi không có DATABASE_URL
  const db = new PGlite(dir);
  await db.waitReady;
  await db.exec("SET TIME ZONE 'Asia/Ho_Chi_Minh'");

  return {
    query: (s, p = []) => db.query(s, p),
    exec: (s) => db.exec(s),
    transaction: (fn) => db.transaction(fn),
    close: () => db.close(),
  };
}

// Các hàm tiện ích truy vấn nhanh dòng dữ liệu
export const rows = async (db, s, p = []) => (await db.query(s, p)).rows;
export const one = async (db, s, p = []) => (await rows(db, s, p))[0];