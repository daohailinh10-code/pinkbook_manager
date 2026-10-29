import { spawn } from "node:child_process";

// 1. Khởi động Backend (Node.js)
const backend = spawn(
  process.execPath,
  ["--env-file-if-exists=.env", "server/index.js"],
  { stdio: ["inherit", "inherit", "inherit", "ipc"] }
);

// 2. Khởi động Frontend (Vite)
const frontend = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "--config", "frontend/vite.config.js"],
  { stdio: "inherit" }
);

let stopping = false;

// Hàm tắt toàn bộ các tiến trình an toàn
function stop() {
  if (stopping) return;
  stopping = true;

  console.log("\n đang tắt hệ thống PinkBook...");

  // Tắt tiến trình Vite (Frontend)
  frontend.kill();

  // Tắt Backend thông minh qua kênh IPC (nếu kết nối), nếu không thì kill trực tiếp
  if (backend.connected) {
    backend.send("shutdown");
  } else {
    backend.kill();
  }
}

// Xử lý khi Backend đột ngột thoát
backend.on("exit", (code) => {
  if (!stopping) {
    console.log(`Backend đã dừng với mã code ${code}`);
    frontend.kill();
  }
  process.exitCode = code || 0;
});

// Xử lý khi Frontend đột ngột thoát
frontend.on("exit", () => {
  if (!stopping) {
    console.log("Frontend đã dừng.");
    stop();
  }
});

// Bắt sự kiện bấm Ctrl + C từ bàn phím (SIGINT) hoặc lệnh hệ thống (SIGTERM)
process.on("SIGINT", stop);
process.on("SIGTERM", stop);