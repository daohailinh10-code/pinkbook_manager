import { rows, one } from "./db.js";
import { readFile } from "node:fs/promises";

// Danh sách các bảng đồng bộ chuẩn cho hệ thống Quản lý Sách (PinkBook)
export const TABLES = [
  "users",
  "categories",
  "suppliers",
  "products",
  "stock",
  "customers",
  "memberships",
  "orders",
  "order_items",
  "employees",
  "attendances",
  "salaries",
  "vouchers",
  "movements",
  "audit",
  "settings",
];

const jsonColumns = new Set([
  "permissions",
  "attributes",
  "specs",
  "lines",
  "history",
  "before_data",
  "after_data",
]);

export async function exportData(db) {
  return db.transaction(async (tx) => {
    const tables = {};
    for (const t of TABLES) {
      // Đảm bảo bảng tồn tại hoặc tránh lỗi nếu bảng trống/chưa khởi tạo schema đầy đủ
      try {
        tables[t] = await rows(tx, `SELECT * FROM ${t}`);
      } catch (e) {
        tables[t] = [];
      }
    }
    return {
      format: "nhom31-backup-v1",
      created_at: new Date().toISOString(),
      tables,
    };
  });
}

export async function importData(db, payload) {
  if (payload.format !== "nhom31-backup-v1" || !payload.tables)
    throw Error("Không đúng định dạng backup.");

  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );

  return db.transaction(async (tx) => {
    for (const t of TABLES) {
      try {
        const countRes = await one(tx, `SELECT COUNT(*) n FROM ${t}`);
        if (countRes && Number(countRes.n) > 0) {
          throw Error("Chỉ khôi phục vào cơ sở dữ liệu trống để tránh mất dữ liệu.");
        }
      } catch (e) {
        // Bỏ qua nếu bảng chưa được tạo trong schema cũ
        continue;
      }
    }

    for (const t of TABLES) {
      if (!payload.tables[t]) continue;
      if (!Array.isArray(payload.tables[t])) throw Error("Thiếu dữ liệu bảng " + t);

      const allowed = (
        await rows(
          tx,
          "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
          [t],
        )
      ).map((x) => x.column_name);

      for (const row of payload.tables[t]) {
        const keys = Object.keys(row);
        if (keys.some((k) => !allowed.includes(k)))
          throw Error("Cột không hợp lệ trong bảng " + t);

        const values = keys.map((k) =>
          jsonColumns.has(k) && row[k] !== null
            ? JSON.stringify(row[k])
            : row[k],
        );

        await tx.query(
          `INSERT INTO ${t}(${keys.join(",")}) VALUES(${keys.map((_, i) => "$" + (i + 1)).join(",")})`,
          values,
        );
      }

      if (allowed.includes("id") && t !== "settings") {
        const mResult = await one(tx, `SELECT COALESCE(MAX(id),0) n FROM ${t}`);
        const m = Number(mResult?.n || 0);
        await tx.query("SELECT setval(pg_get_serial_sequence($1,'id'),$2,$3)", [
          t,
          m || 1,
          m > 0,
        ]);
      }
    }
    return { tables: TABLES.length };
  });
}