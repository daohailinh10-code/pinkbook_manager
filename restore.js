import { acquireDataLock } from "../server/lock.js";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { openDb } from "../server/db.js";
import { importData } from "../server/backup.js";
const file = process.argv[2];
if (!file) throw Error("Cách dùng: npm run restore -- backups/ten-file.json");
const root = resolve(process.env.DATA_DIR || "./data");
await mkdir(root, { recursive: true });
const release = await acquireDataLock(root);
const db = await openDb({ dir: resolve(root, "db") });
try {
  await importData(db, JSON.parse(await readFile(file, "utf8")));
  console.log(
    "Khôi phục thành công. Tài khoản/mật khẩu giữ như bản sao lưu; các phiên đăng nhập cũ không được khôi phục.",
  );
} finally {
  await db.close();
  await release();
}