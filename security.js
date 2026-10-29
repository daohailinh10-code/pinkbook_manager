import {
  scrypt as scryptCb,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(p, hash) {
  const [salt, key] = hash.split(":");
  const actual = await scrypt(p, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, "hex"));
}

export const digest = (s) => createHash("sha256").update(s).digest("hex");

export const safeUser = (u) => {
  if (!u) return null;
  const { password, ...safe } = u;
  return safe;
};

export const PERMISSIONS = [
  "products",
  "categories",
  "suppliers",
  "inventory",
  "receiving",
  "shipping",
  "orders",
];

export function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}

export function requireUser(u) {
  if (!u) fail("Vui lòng đăng nhập.", 401);
  return u;
}

export function permit(u, p) {
  requireUser(u);
  if (u.role === "owner") return;
  if (u.role !== "employee" || !u.permissions.includes(p))
    fail("Bạn không có quyền thực hiện thao tác này.", 403);
}

export function owner(u) {
  requireUser(u);
  if (u.role !== "owner") fail("Chức năng chỉ dành cho chủ cửa hàng.", 403);
}

export function customer(u) {
  requireUser(u);
  if (u.role !== "customer")
    fail("Chức năng dành cho tài khoản khách hàng.", 403);
}

export function text(v, label, max = 500) {
  if (typeof v !== "string" || !v.trim() || v.length > max)
    fail(`${label}: cần nhập từ 1 đến ${max} ký tự.`);
  return v.trim();
}

export function optional(v, max = 2000) {
  if (v == null) return "";
  if (typeof v !== "string" || v.length > max)
    fail("Nội dung quá dài hoặc không hợp lệ.");
  return v.trim();
}

export function integer(v, label, min = 1, max = 1000000) {
  const n = Number(v);
  if (v === "" || !Number.isSafeInteger(n) || n < min || n > max)
    fail(`${label}: cần số nguyên từ ${min} đến ${max}.`);
  return n;
}

export function money(v) {
  return integer(v, "Giá", 0, 1000000000);
}

export function url(v) {
  const s = optional(v, 2000);
  if (!s) return "";
  try {
    const u = new URL(s);
    if (!["https:", "http:"].includes(u.protocol))
      fail("Liên kết phải bắt đầu bằng https:// hoặc http://.");
  } catch {
    fail("Liên kết không hợp lệ.");
  }
  return s;
}

// Kiểm tra tính hợp lệ của Số điện thoại đăng nhập
export function phone(v) {
  const s = text(v, "Số điện thoại", 20);
  // Kiểm tra định dạng số điện thoại cơ bản (từ 9 đến 15 chữ số)
  const cleanPhone = s.replace(/[\s+()-]/g, "");
  if (!/^\d{9,15}$/.test(cleanPhone)) {
    fail("Số điện thoại không hợp lệ.");
  }
  return s;
}

// Email trở thành tùy chọn (dùng cho hồ sơ nếu khách muốn điền)
export function optionalEmail(v) {
  const s = optional(v, 150).toLowerCase();
  if (!s) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) fail("Email không hợp lệ.");
  return s;
}

export function password(v) {
  if (typeof v !== "string" || v.length < 10 || v.length > 128)
    fail("Mật khẩu phải dài 10–128 ký tự.");
  return v;
}