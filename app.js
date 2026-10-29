import express from "express";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { one } from "./db.js";
import { command, state, audit } from "./service.js";
import {
  text,
  hashPassword,
  verifyPassword,
  safeUser,
  digest,
  fail,
} from "./security.js";

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  // Thiết lập các header bảo mật
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "same-origin",
      "Cache-Control": "no-store",
    });
    if (req.path.startsWith("/api") && !["GET", "HEAD"].includes(req.method)) {
      const origin = req.headers.origin;
      const trusted = [
        `http://${req.headers.host}`,
        process.env.APP_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
      ].filter(Boolean);
      if (origin && !trusted.includes(origin))
        return res.status(403).json({ error: "Nguồn yêu cầu không được phép." });
      
      // Kiểm tra mã xác nhận yêu cầu (nếu cần thiết cho bảo mật nhóm)
      if (req.headers["x-app-request"] !== "nhom31")
        return res.status(403).json({ error: "Thiếu mã xác nhận yêu cầu." });
    }
    next();
  });

  // Giới hạn tần suất gọi API (Rate Limiter chống Brute-force)
  const attempts = new Map();
  const limit = (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    let a = attempts.get(key);
    if (!a || now > a.until) {
      a = { count: 0, until: now + 15 * 60e3 };
      attempts.set(key, a);
    }
    if (++a.count > 50)
      return res.status(429).json({ error: "Quá nhiều lần thử. Chờ 15 phút." });
    if (attempts.size > 10000)
      for (const [k, v] of attempts) if (v.until < now) attempts.delete(k);
    next();
  };

  const token = (req) => {
    try {
      return (
        (req.headers.cookie || "")
          .split(";")
          .map((x) => x.trim())
          .find((x) => x.startsWith("session="))
          ?.slice(8) || ""
      );
    } catch {
      return "";
    }
  };

  const current = async (tx, req) => {
    const t = token(req);
    if (!t) return null;
    return (
      (await one(
        tx,
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=$1 AND s.expires_at>NOW() AND u.active",
        [digest(t)],
      )) || null
    );
  };

  const cookie = (res, t) =>
    res.cookie("session", t, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "1",
      maxAge: 7 * 24 * 3600e3,
      path: "/",
    });

  app.get("/api/health", (req, res) => res.json({ ok: true }));

  // Đăng ký tài khoản (Họ tên, Ngày sinh, Số điện thoại, Mật khẩu)
  app.post("/api/register", limit, async (req, res) => {
    const b = req.body;
    const phone = String(b.phone || "").trim();
    const name = text(b.name, "Họ tên", 100);
    const dob = b.dob; // Ngày tháng năm sinh
    const hash = await hashPassword(String(b.password || ""));

    await db.transaction(async (tx) => {
      const u = await one(
        tx,
        "INSERT INTO users(phone,name,dob,password,role) VALUES($1,$2,$3,$4,'customer') RETURNING id",
        [phone, name, dob, hash],
      );
      await audit(tx, { id: u.id }, "register", `user:${u.id}`, null, {
        role: "customer",
      });
    });
    res.json({ message: "Đăng ký thành công. Hãy đăng nhập." });
  });

  // Đăng nhập bằng Số điện thoại và Mật khẩu
  app.post("/api/login", limit, async (req, res) => {
    const phone = String(req.body.phone || "").trim();
    const p = String(req.body.password || "");
    if (p.length > 128) fail("Thông tin đăng nhập không hợp lệ.", 401);

    const result = await db.transaction(async (tx) => {
      const u = await one(tx, "SELECT * FROM users WHERE phone=$1", [phone]);
      
      // Nếu số điện thoại chưa đăng ký
      if (!u) {
        fail("Tài khoản không tồn tại", 401);
      }
      
      // Nếu mật khẩu không đúng hoặc tài khoản bị khóa
      if (!u.active || !(await verifyPassword(p, u.password))) {
        fail("Mật khẩu không đúng", 401);
      }

      const t = randomBytes(32).toString("hex");
      await tx.query("DELETE FROM sessions WHERE expires_at<NOW()");
      await tx.query(
        "INSERT INTO sessions(token,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '7 days')",
        [digest(t), u.id],
      );
      return { u, t };
    });

    cookie(res, result.t);
    res.json({ user: safeUser(result.u) });
  });

  app.post("/api/logout", async (req, res) => {
    await db.transaction((tx) =>
      tx.query("DELETE FROM sessions WHERE token=$1", [digest(token(req))]),
    );
    res.clearCookie("session", { path: "/" });
    res.json({ ok: true });
  });

  app.get("/api/state", async (req, res) =>
    res.json(
      await db.transaction(async (tx) => state(tx, await current(tx, req))),
    ),
  );

  app.post("/api/action/:action", async (req, res) =>
    res.json(
      await db.transaction(async (tx) =>
        command(tx, await current(tx, req), req.params.action, req.body),
      ),
    ),
  );

  app.use("/api", (req, res) =>
    res.status(404).json({ error: "API không tồn tại." }),
  );

  const dist = resolve("frontend/dist");
  if (existsSync(dist)) {
    app.use(
      express.static(dist, {
        setHeaders: (res) =>
          res.setHeader("Cache-Control", "public,max-age=300"),
      }),
    );
    app.get("*", (req, res) =>
      res.sendFile(resolve(dist, "index.html")),
    );
  }

  // Xử lý lỗi hệ thống chung
  app.use((e, req, res, next) => {
    if (e.code === "23505")
      return res
        .status(409)
        .json({ error: "Số điện thoại này đã được đăng ký hoặc dữ liệu đã tồn tại." });
    if (e.code === "23503")
      return res
        .status(400)
        .json({ error: "Dữ liệu tham chiếu không tồn tại." });
    if (e.type === "entity.too.large")
      return res.status(413).json({ error: "Dữ liệu gửi quá lớn." });
    if (e instanceof SyntaxError && "body" in e)
      return res.status(400).json({ error: "JSON không hợp lệ." });
    if (!e.status) console.error("Server error:", e.message);
    res.status(e.status || 500).json({
      error: e.status ? e.message : "Không thể xử lý. Dữ liệu đã được hoàn tác.",
    });
  });

  return app;
}