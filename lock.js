import { acquireDataLock } from "./lock.js";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { openDb } from "./db.js";
import { initialize } from "./seed.js";
import { createApp } from "./app.js";
const root = resolve(process.env.DATA_DIR || "./data");
await mkdir(root, { recursive: true });
const release = await acquireDataLock(root);
const db = await openDb({ dir: resolve(root, "db") });
await initialize(db, { credentialDir: root });
const port = Number(process.env.PORT || 3001);
const server = createApp(db).listen(port, process.env.HOST || "127.0.0.1", () =>
  console.log(`Backend & production web: http://localhost:${port}`),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await db.close();
    await release();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

server.on("error", async (e) => {
  console.error(e.message);
  await db.close();
  await release();
  process.exit(1);
});

process.on("message", (m) => {
  if (m === "shutdown") stop();
});