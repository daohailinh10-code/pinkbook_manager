import { rows, one } from "./db.js";
import {
  fail,
  permit,
  owner,
  customer,
  requireUser,
  text,
  optional,
  integer,
  money,
  url,
  optionalEmail,
  phone as validatePhone,
  password,
  hashPassword,
  safeUser,
  PERMISSIONS,
  digest,
} from "./security.js";

const json = JSON.stringify;

const publicProduct = (p) => ({
  ...p,
  price: Number(p.price),
  actual: Number(p.actual || 0),
  reserved: Number(p.reserved || 0),
  available: Number(p.actual || 0) - Number(p.reserved || 0),
});

export async function audit(
  db,
  u,
  action,
  entity,
  before = null,
  after = null,
) {
  await db.query(
    "INSERT INTO audit(actor,action,entity,before_data,after_data) VALUES($1,$2,$3,$4,$5)",
    [u?.id || null, action, entity, json(before), json(after)],
  );
}

export async function catalog(db, all = false) {
  return (
    await rows(
      db,
      `SELECT p.*,c.name category,c.attributes,COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id=p.id),0) actual,COALESCE((SELECT SUM((line->>'quantity')::int) FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.lines) line WHERE o.status IN ('pending','confirmed') AND (line->>'product_id')::int=p.id),0) reserved FROM products p JOIN categories c ON p.category_id=c.id ${all ? "" : "WHERE p.active AND c.active"} ORDER BY p.id`,
    )
  ).map(publicProduct);
}

async function product(db, id, active = false) {
  const p = await one(
    db,
    "SELECT p.*,c.active category_active FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=$1",
    [integer(id, "Sách")],
  );
  if (!p || (active && (!p.active || !p.category_active)))
    fail("Sách này hiện không còn kinh doanh.", 409);
  return p;
}

async function balances(db, id) {
  const r = await one(
    db,
    `SELECT COALESCE((SELECT SUM(quantity) FROM stock WHERE product_id=$1),0) actual,COALESCE((SELECT SUM((line->>'quantity')::int) FROM orders CROSS JOIN LATERAL jsonb_array_elements(lines) line WHERE status IN ('pending','confirmed') AND (line->>'product_id')::int=$1),0) reserved`,
    [id],
  );
  return { actual: Number(r.actual), reserved: Number(r.reserved) };
}

async function validLines(db, input, active = true) {
  if (!Array.isArray(input) || !input.length || input.length > 200)
    fail("Cần từ 1 đến 200 tựa sách trong đơn.");
  const seen = new Set();
  const result = [];
  for (const l of input) {
    const p = await product(db, l.product_id, active);
    if (seen.has(p.id)) fail("Mã sách bị lặp. Hãy gộp số lượng.");
    seen.add(p.id);
    result.push({
      product_id: p.id,
      quantity: integer(l.quantity, "Số lượng"),
      note: optional(l.note, 300),
    });
  }
  return result;
}

async function getOrder(db, id) {
  const o = await one(db, "SELECT * FROM orders WHERE id=$1 FOR UPDATE", [
    integer(id, "Mã đơn"),
  ]);
  if (!o) fail("Không tìm thấy đơn hàng.", 404);
  return o;
}

async function status(db, u, o, next, note = "") {
  const history = [
    ...o.history,
    { status: next, at: new Date().toISOString(), actor: u.id, note },
  ];
  await db.query(
    "UPDATE orders SET status=$1,history=$2,completed_at=CASE WHEN $1='completed' THEN NOW() ELSE completed_at END,paid=CASE WHEN $1='completed' THEN TRUE ELSE paid END WHERE id=$3",
    [next, json(history), o.id],
  );
  await audit(
    db,
    u,
    "order.status",
    `order:${o.id}`,
    { status: o.status },
    { status: next, note },
  );
}

function dateRange(b) {
  const from = b.from || "2000-01-01",
    to = b.to || "2100-01-01";
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !Number.isFinite(Date.parse(from)) ||
    !Number.isFinite(Date.parse(to)) ||
    from > to
  )
    fail("Khoảng ngày không hợp lệ.");
  return [from, to];
}

async function reference(db, table, id) {
  const r = await one(db, `SELECT * FROM ${table} WHERE id=$1`, [
    integer(id, "Mã tham chiếu"),
  ]);
  if (!r || !r.active) fail("Danh mục/nhà cung cấp/vị trí không hoạt động.");
  return r;
}

export async function state(db, u) {
  const products = await catalog(db, !!u && u.role !== "customer");
  const categories = await rows(db, "SELECT * FROM categories ORDER BY id");
  const settings = await one(db, "SELECT * FROM settings WHERE id=1");
  const out = {
    user: safeUser(u),
    products,
    categories: categories.filter(
      (c) => c.active || (u?.role !== "customer" && !!u),
    ),
    settings,
  };
  if (!u) return out;
  if (u.role === "customer") {
    out.cart =
      (await one(db, "SELECT lines FROM carts WHERE user_id=$1", [u.id]))
        ?.lines || [];
    out.boms = await rows(
      db,
      "SELECT * FROM boms WHERE user_id=$1 ORDER BY id DESC",
      [u.id],
    );
    out.orders = await rows(
      db,
      "SELECT * FROM orders WHERE user_id=$1 ORDER BY id DESC",
      [u.id],
    );
    return out;
  }
  const can = (p) => u.role === "owner" || u.permissions.includes(p);
  if (can("orders") || can("shipping"))
    out.orders = await rows(
      db,
      "SELECT o.*,u.name customer_name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.id DESC",
    );
  if (can("inventory") || can("receiving") || can("shipping")) {
    out.locations = await rows(db, "SELECT * FROM locations ORDER BY id");
    out.stock = await rows(
      db,
      "SELECT * FROM stock ORDER BY product_id,location_id",
    );
    out.vouchers = await rows(db, "SELECT * FROM vouchers ORDER BY id DESC");
  }
  if (can("suppliers") || can("receiving"))
    out.suppliers = await rows(db, "SELECT * FROM suppliers ORDER BY id");
  if (u.role === "owner")
    out.users = (await rows(db, "SELECT * FROM users ORDER BY id")).map(
      safeUser,
    );
  return out;
}

export async function command(db, u, action, b = {}) {
  if (action === "profile") {
    requireUser(u);
    const before = safeUser(u);
    const name = text(b.name, "Họ tên", 100),
      phone = optional(b.phone, 30),
      address = optional(b.address, 500);
    await db.query(
      "UPDATE users SET name=$1,phone=$2,address=$3,version=version+1 WHERE id=$4",
      [name, phone, address, u.id],
    );
    if (b.new_password) {
      const { verifyPassword } = await import("./security.js");
      if (!(await verifyPassword(String(b.old_password || ""), u.password)))
        fail("Mật khẩu hiện tại không đúng.");
      await db.query("UPDATE users SET password=$1 WHERE id=$2", [
        await hashPassword(password(b.new_password)),
        u.id,
      ]);
      await db.query("DELETE FROM sessions WHERE user_id=$1", [u.id]);
    }
    await audit(
      db,
      u,
      "profile",
      `user:${u.id}`,
      { name: before.name, phone: before.phone, address: before.address },
      { name, phone, address },
    );
    return {
      message: b.new_password
        ? "Đã đổi mật khẩu. Hãy đăng nhập lại."
        : "Đã lưu hồ sơ.",
    };
  }
  if (action === "cart.add") {
    customer(u);
    const p = await product(db, b.product_id, true);
    const quantity = integer(b.quantity, "Số lượng");
    const lines =
      (await one(db, "SELECT lines FROM carts WHERE user_id=$1", [u.id]))
        ?.lines || [];
    const existing = lines.find((l) => l.product_id === p.id);
    if (existing)
      existing.quantity = integer(existing.quantity + quantity, "Số lượng");
    else lines.push({ product_id: p.id, quantity });
    if (lines.length > 200) fail("Giỏ hàng tối đa 200 tựa sách.");
    await db.query(
      "INSERT INTO carts(user_id,lines) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET lines=$2",
      [u.id, json(lines)],
    );
    return { message: "Đã thêm sách vào giỏ hàng." };
  }
  if (action === "cart.save") {
    customer(u);
    const lines = b.lines?.length ? await validLines(db, b.lines) : [];
    await db.query(
      "INSERT INTO carts(user_id,lines) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET lines=$2",
      [u.id, json(lines)],
    );
    return { message: "Đã cập nhật giỏ hàng." };
  }
  if (action === "bom.save") {
    customer(u);
    const name = text(b.name, "Tên danh sách", 120),
      lines = b.lines?.length ? await validLines(db, b.lines, false) : [],
      notes = optional(b.notes);
    if (b.id) {
      const old = await one(
        db,
        "SELECT * FROM boms WHERE id=$1 AND user_id=$2",
        [b.id, u.id],
      );
      if (!old) fail("Không tìm thấy danh sách yêu thích.", 404);
      await db.query(
        "UPDATE boms SET name=$1,notes=$2,lines=$3,updated_at=NOW() WHERE id=$4",
        [name, notes, json(lines), b.id],
      );
      return { id: b.id };
    }
    return await one(
      db,
      "INSERT INTO boms(user_id,name,notes,lines) VALUES($1,$2,$3,$4) RETURNING id",
      [u.id, name, notes, json(lines)],
    );
  }
  if (action === "bom.delete") {
    customer(u);
    const old = await one(
      db,
      "DELETE FROM boms WHERE id=$1 AND user_id=$2 RETURNING id",
      [integer(b.id, "Danh sách"), u.id],
    );
    if (!old) fail("Không tìm thấy danh sách.", 404);
    return { message: "Đã xóa danh sách." };
  }
  if (action === "bom.toCart") {
    customer(u);
    const bom = await one(db, "SELECT * FROM boms WHERE id=$1 AND user_id=$2", [
      integer(b.id, "Danh sách"),
      u.id,
    ]);
    if (!bom) fail("Không tìm thấy danh sách.", 404);
    if (!Array.isArray(b.product_ids) || !b.product_ids.length)
      fail("Chọn dòng sách cần chuyển.");
    const lines = bom.lines.filter((l) => b.product_ids.includes(l.product_id));
    await validLines(db, lines);
    const cart =
      (await one(db, "SELECT lines FROM carts WHERE user_id=$1", [u.id]))
        ?.lines || [];
    for (const l of lines) {
      const exists = cart.find((x) => x.product_id === l.product_id);
      if (exists)
        exists.quantity = integer(exists.quantity + l.quantity, "Số lượng");
      else cart.push({ ...l });
    }
    await db.query(
      "INSERT INTO carts(user_id,lines) VALUES($1,$2) ON CONFLICT(user_id) DO UPDATE SET lines=$2",
      [u.id, json(cart)],
    );
    return { message: "Đã chuyển sách sang giỏ hàng." };
  }
  if (action === "order.create") {
    customer(u);
    const key = text(b.request_key, "Mã yêu cầu", 100);
    const hash = digest(
      json({
        recipient: b.recipient,
        phone: b.phone,
        address: b.address,
        expected_total: b.expected_total,
        notes: b.notes || "",
      }),
    );
    const old = await one(
      db,
      "SELECT * FROM orders WHERE user_id=$1 AND request_key=$2",
      [u.id, key],
    );
    if (old) {
      if (old.request_hash !== hash)
        fail("Mã yêu cầu đã dùng cho nội dung khác.", 409);
      return { id: old.id, message: "Đơn đã được ghi nhận trước đó." };
    }
    const recipient = text(b.recipient, "Tên người nhận", 100),
      phone = text(b.phone, "Số điện thoại", 30),
      address = text(b.address, "Địa chỉ nhận sách", 500);
    if (!/^[+\d\s().-]{8,30}$/.test(phone)) fail("Số điện thoại không hợp lệ.");
    const cart =
      (await one(db, "SELECT lines FROM carts WHERE user_id=$1", [u.id]))
        ?.lines || [];
    const valid = await validLines(db, cart);
    const lines = [];
    let total = 0;
    for (const l of valid) {
      const p = await product(db, l.product_id, true);
      const balance = await balances(db, p.id);
      if (balance.actual - balance.reserved < l.quantity)
        fail(`Sách '${p.name}': không đủ tồn khả dụng.`, 409);
      lines.push({
        ...l,
        sku: p.sku,
        name: p.name,
        unit: p.unit,
        price: Number(p.price),
      });
      total += Number(p.price) * l.quantity;
    }
    if (total !== Number(b.expected_total))
      fail("Giá sách đã thay đổi. Vui lòng tải lại giỏ hàng.", 409);
    const o = await one(
      db,
      "INSERT INTO orders(user_id,request_key,request_hash,recipient,phone,address,notes,lines,total,history) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id",
      [
        u.id,
        key,
        hash,
        recipient,
        phone,
        address,
        optional(b.notes),
        json(lines),
        total,
        json([
          {
            status: "pending",
            at: new Date().toISOString(),
            actor: u.id,
            note: "Đặt hàng COD",
          },
        ]),
      ],
    );
    await db.query("DELETE FROM carts WHERE user_id=$1", [u.id]);
    await audit(db, u, "order.create", `order:${o.id}`, null, { total, lines });
    return { ...o, message: "Đặt hàng thành công; sách đã được giữ." };
  }
  if (action === "order.status") {
    const o = await getOrder(db, b.id);
    const next = b.status;
    const note = optional(b.note, 500);
    if (next === "cancelled") {
      customer(u);
      if (o.user_id !== u.id)
        fail("Không được truy cập đơn của người khác.", 403);
    } else permit(u, "orders");
    if (o.status === next) return { id: o.id };
    const allowed = {
      pending: ["confirmed", "cancelled", "rejected"],
      shipped: ["delivering"],
      delivering: ["completed"],
    };
    if (!allowed[o.status]?.includes(next))
      fail("Chuyển trạng thái đơn hàng không hợp lệ.", 409);
    if (["cancelled", "rejected"].includes(next) && !note)
      fail("Cần nhập lý do hủy/từ chối.");
    if (next === "completed" && b.paid !== true)
      fail("Cần xác nhận đã giao và thu tiền COD.");
    await status(db, u, o, next, note);
    return { message: "Đã cập nhật đơn hàng." };
  }
  if (action === "product.save") {
    permit(u, "products");
    const old = b.id ? await product(db, b.id) : null;
    if (Object.hasOwn(b, "price") && u.role !== "owner")
      fail("Nhân viên không được sửa giá sách.", 403);
    await reference(db, "categories", b.category_id);
    const specs = b.specs || {};
    if (
      typeof specs !== "object" ||
      Array.isArray(specs) ||
      Object.keys(specs).length > 50 ||
      json(specs).length > 10000 ||
      Object.values(specs).some((v) => typeof v !== "string")
    )
      fail("Thông số kỹ thuật không hợp lệ.");
    const data = [
      text(b.sku, "Mã sách", 50),
      text(b.name, "Tên sách", 150),
      integer(b.category_id, "Danh mục"),
      text(b.unit || "cuốn", "Đơn vị", 20),
      optional(b.description, 5000),
      url(b.image),
      url(b.datasheet),
      url(b.pinout),
      json(specs),
      b.active !== false,
    ];
    let p;
    if (old) {
      p = await one(
        db,
        "UPDATE products SET sku=$1,name=$2,category_id=$3,unit=$4,description=$5,image=$6,datasheet=$7,pinout=$8,specs=$9,active=$10 WHERE id=$11 RETURNING *",
        [...data, old.id],
      );
    } else
      p = await one(
        db,
        "INSERT INTO products(sku,name,category_id,unit,description,image,datasheet,pinout,specs,active) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
        data,
      );
    await audit(db, u, "product.save", `product:${p.id}`, old, p);
    return { id: p.id, message: "Đã lưu thông tin sách. Giá được quản lý riêng." };
  }
  if (action === "price.save") {
    owner(u);
    const p = await product(db, b.id);
    const price = money(b.price);
    await db.query("UPDATE products SET price=$1 WHERE id=$2", [price, p.id]);
    await audit(
      db,
      u,
      "price.save",
      `product:${p.id}`,
      { price: p.price },
      { price },
    );
    return { message: "Đã cập nhật giá bán sách." };
  }
  if (action === "category.save") {
    permit(u, "categories");
    const attrs = b.attributes || [];
    if (!Array.isArray(attrs) || attrs.length > 30)
      fail("Tối đa 30 thuộc tính.");
    const attributes = attrs.map((a) => ({
      name: text(a.name, "Tên thuộc tính", 60),
      unit: optional(a.unit, 20),
    }));
    if (new Set(attributes.map((a) => a.name)).size !== attributes.length)
      fail("Tên thuộc tính bị lặp.");
    const old = b.id
      ? await one(db, "SELECT * FROM categories WHERE id=$1", [b.id])
      : null;
    if (b.id && !old) fail("Không tìm thấy danh mục.", 404);
    const params = [
      text(b.name, "Tên danh mục", 100),
      json(attributes),
      b.active !== false,
    ];
    const r = old
      ? await one(
          db,
          "UPDATE categories SET name=$1,attributes=$2,active=$3 WHERE id=$4 RETURNING *",
          [...params, b.id],
        )
      : await one(
          db,
          "INSERT INTO categories(name,attributes,active) VALUES($1,$2,$3) RETURNING *",
          params,
        );
    await audit(db, u, action, `category:${r.id}`, old, r);
    return r;
  }
  if (action === "supplier.save" || action === "location.save") {
    const supplier = action.startsWith("supplier");
    permit(u, supplier ? "suppliers" : "inventory");
    const table = supplier ? "suppliers" : "locations";
    const old = b.id
      ? await one(db, `SELECT * FROM ${table} WHERE id=$1`, [b.id])
      : null;
    if (b.id && !old) fail("Không tìm thấy dữ liệu.", 404);
    if (!supplier && b.active === false && old) {
      const occupied = await one(
        db,
        "SELECT SUM(quantity) n FROM stock WHERE location_id=$1",
        [old.id],
      );
      if (Number(occupied.n) > 0)
        fail("Chuyển hết sách trước khi ngừng vị trí kho này.");
    }
    let r;
    const name = text(b.name, "Tên", 120);
    if (supplier) {
      const p = [
        name,
        optional(b.phone, 30),
        optionalEmail(b.email),
        optional(b.address, 500),
        b.active !== false,
      ];
      r = old
        ? await one(
            db,
            "UPDATE suppliers SET name=$1,phone=$2,email=$3,address=$4,active=$5 WHERE id=$6 RETURNING *",
            [...p, b.id],
          )
        : await one(
            db,
            "INSERT INTO suppliers(name,phone,email,address,active) VALUES($1,$2,$3,$4,$5) RETURNING *",
            p,
          );
    } else {
      r = old
        ? await one(
            db,
            "UPDATE locations SET name=$1,active=$2 WHERE id=$3 RETURNING *",
            [name, b.active !== false, b.id],
          )
        : await one(
            db,
            "INSERT INTO locations(name,active) VALUES($1,$2) RETURNING *",
            [name, b.active !== false],
          );
    }
    await audit(db, u, action, `${table}:${r.id}`, old, r);
    return r;
  }
  if (action === "voucher.save") {
    return saveVoucher(db, u, b);
  }
  if (action === "voucher.confirm") {
    return confirmVoucher(db, u, b);
  }
  if (action === "user.save") {
    owner(u);
    const old = b.id
      ? await one(db, "SELECT * FROM users WHERE id=$1", [
          integer(b.id, "Tài khoản"),
        ])
      : null;
    if (b.id && !old) fail("Không tìm thấy tài khoản.", 404);
    if (old && old.role !== "employee")
      fail("Chỉ chỉnh hồ sơ nhân viên tại đây.");
    const name = text(b.name, "Họ tên", 100),
      phone = validatePhone(b.phone),
      emailVal = optionalEmail(b.email);
    let r;
    if (old) {
      if (Number(b.version) !== old.version)
        fail("Hồ sơ đã thay đổi. Tải lại trước khi lưu.", 409);
      r = await one(
        db,
        "UPDATE users SET name=$1,phone=$2,email=$3,version=version+1 WHERE id=$4 RETURNING *",
        [name, phone, emailVal, old.id],
      );
    } else
      r = await one(
        db,
        "INSERT INTO users(name,phone,email,password,role) VALUES($1,$2,$3,$4,'employee') RETURNING *",
        [name, phone, emailVal, await hashPassword(password(b.password))],
      );
    await audit(db, u, action, `user:${r.id}`, safeUser(old), safeUser(r));
    return safeUser(r);
  }
  if (action === "user.permissions" || action === "user.active") {
    owner(u);
    const target = await one(db, "SELECT * FROM users WHERE id=$1", [
      integer(b.id, "Tài khoản"),
    ]);
    if (!target) fail("Không tìm thấy tài khoản.", 404);
    if (target.role === "owner")
      fail("Không thể thay đổi quyền hoặc khóa tài khoản chủ cửa hàng.", 403);
    if (Number(b.version) !== target.version)
      fail("Tài khoản đã đổi. Hãy tải lại.", 409);
    if (action === "user.permissions") {
      if (target.role !== "employee")
        fail("Chỉ cấp quyền nghiệp vụ cho nhân viên.");
      if (
        !Array.isArray(b.permissions) ||
        b.permissions.some((p) => !PERMISSIONS.includes(p))
      )
        fail("Quyền hạn không hợp lệ.");
      await db.query(
        "UPDATE users SET permissions=$1,version=version+1 WHERE id=$2",
        [json([...new Set(b.permissions)]), target.id],
      );
    } else {
      if (typeof b.active !== "boolean") fail("Trạng thái không hợp lệ.");
      text(b.reason, "Lý do", 500);
      await db.query(
        "UPDATE users SET active=$1,version=version+1 WHERE id=$2",
        [b.active, target.id],
      );
      if (!b.active)
        await db.query("DELETE FROM sessions WHERE user_id=$1", [target.id]);
    }
    const after = await one(db, "SELECT * FROM users WHERE id=$1", [target.id]);
    await audit(db, u, action, `user:${target.id}`, safeUser(target), {
      ...safeUser(after),
      reason: b.reason,
    });
    return { message: "Đã cập nhật. Quyền mới áp dụng ngay." };
  }
  if (action === "settings.save") {
    owner(u);
    const old = await one(db, "SELECT * FROM settings WHERE id=1");
    const values = [
      text(b.store_name, "Tên cửa hàng", 120),
      optional(b.phone, 30),
      optional(b.address, 500),
      integer(b.low_stock, "Ngưỡng cảnh báo tồn", 0),
    ];
    await db.query(
      "UPDATE settings SET store_name=$1,phone=$2,address=$3,low_stock=$4 WHERE id=1",
      values,
    );
    await audit(db, u, action, "settings:1", old, b);
    return { message: "Đã lưu cấu hình cửa hàng." };
  }
  if (action === "report") {
    owner(u);
    const [from, to] = dateRange(b);
    const orders = await rows(
      db,
      "SELECT * FROM orders WHERE status='completed' AND completed_at >= $1::date AND completed_at < $2::date + INTERVAL '1 day' ORDER BY id DESC",
      [from, to],
    );
    const byProduct = new Map();
    for (const o of orders)
      for (const l of o.lines) {
        const p = byProduct.get(l.product_id) || {
          sku: l.sku,
          name: l.name,
          quantity: 0,
          revenue: 0,
        };
        p.quantity += l.quantity;
        p.revenue += l.price * l.quantity;
        byProduct.set(l.product_id, p);
      }
    return {
      revenue: orders.reduce((s, o) => s + Number(o.total), 0),
      count: orders.length,
      products: [...byProduct.values()].sort((a, b) => b.quantity - a.quantity),
      orders,
      stock: await catalog(db, true),
      as_of: new Date().toISOString(),
    };
  }
  if (action === "movements") {
    permit(u, "inventory");
    const [from, to] = dateRange(b);
    return await rows(
      db,
      `SELECT m.*,p.sku,p.name,l.name location,u.name actor_name,v.type,v.order_id,v.reference_id,v.reason FROM movements m JOIN products p ON p.id=m.product_id JOIN locations l ON l.id=m.location_id JOIN users u ON u.id=m.actor JOIN vouchers v ON v.id=m.voucher_id WHERE m.created_at >= $1::date AND m.created_at < $2::date + INTERVAL '1 day' ORDER BY m.id DESC`,
      [from, to],
    );
  }
  if (action === "audit") {
    owner(u);
    const [from, to] = dateRange(b);
    return await rows(
      db,
      "SELECT a.*,u.name actor_name FROM audit a LEFT JOIN users u ON u.id=a.actor WHERE a.created_at >= $1::date AND a.created_at < $2::date + INTERVAL '1 day' ORDER BY a.id DESC",
      [from, to],
    );
  }
  fail("Không tìm thấy chức năng.", 404);
}

function voucherPermission(u, type) {
  if (type === "adjust") owner(u);
  else
    permit(
      u,
      type === "in"
        ? "receiving"
        : type === "transfer"
          ? "inventory"
          : "shipping",
    );
}

async function saveVoucher(db, u, b) {
  const type = b.type;
  if (!["in", "out", "sale", "adjust", "transfer"].includes(type))
    fail("Loại phiếu kho không hợp lệ.");
  voucherPermission(u, type);
  const old = b.id
    ? await one(db, "SELECT * FROM vouchers WHERE id=$1 FOR UPDATE", [
        integer(b.id, "Phiếu"),
      ])
    : null;
  if (b.id && !old) fail("Không tìm thấy phiếu.", 404);
  if (old && (old.status !== "draft" || old.type !== type))
    fail("Không thể sửa phiếu đã xác nhận hoặc đổi loại phiếu.", 409);
  const reason = optional(b.reason, 500);
  if (["out", "adjust", "transfer"].includes(type) && !reason)
    fail("Cần nhập lý do xuất/kiểm kê/chuyển kho.");
  let supplier_id = null,
    order_id = null,
    reference_id = null;
  if (type === "in")
    supplier_id = (await reference(db, "suppliers", b.supplier_id)).id;
  if (b.reference_id) {
    const ref = await one(
      db,
      "SELECT * FROM vouchers WHERE id=$1 AND status='confirmed'",
      [integer(b.reference_id, "Phiếu gốc")],
    );
    if (!ref) fail("Phiếu tham chiếu phải ở trạng thái đã xác nhận.");
    reference_id = ref.id;
  }
  if (type === "sale") {
    const o = await getOrder(db, b.order_id);
    if (o.status !== "confirmed") fail("Chỉ xuất kho cho đơn đã xác nhận.", 409);
    order_id = o.id;
  }
  if (!Array.isArray(b.lines) || !b.lines.length || b.lines.length > 200)
    fail("Phiếu cần từ 1–200 dòng sách.");
  const seen = new Set();
  const lines = [];
  for (const x of b.lines) {
    const p = await product(db, x.product_id);
    const loc = await reference(db, "locations", x.location_id);
    const key = `${p.id}:${loc.id}`;
    if (seen.has(key)) fail("Gộp dòng cùng tựa sách và vị trí.");
    seen.add(key);
    const line = { product_id: p.id, location_id: loc.id };
    if (type === "adjust") {
      line.count = integer(x.count, "Số đếm thực tế", 0);
      line.expected = integer(x.expected, "Tồn hệ thống khi kiểm kê", 0);
    } else line.quantity = integer(x.quantity, "Số lượng");
    if (type === "in") line.cost = money(x.cost || 0);
    if (type === "transfer") {
      line.target_id = (await reference(db, "locations", x.target_id)).id;
      if (line.target_id === loc.id) fail("Vị trí đến phải khác vị trí đi.");
    }
    lines.push(line);
  }
  const params = [supplier_id, order_id, reference_id, reason, json(lines)];
  const r = old
    ? await one(
        db,
        "UPDATE vouchers SET supplier_id=$1,order_id=$2,reference_id=$3,reason=$4,lines=$5 WHERE id=$6 RETURNING *",
        [...params, old.id],
      )
    : await one(
        db,
        "INSERT INTO vouchers(supplier_id,order_id,reference_id,reason,lines,type,created_by) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
        [...params, type, u.id],
      );
  await audit(db, u, "voucher.draft", `voucher:${r.id}`, old, r);
  return { id: r.id, message: "Đã lưu phiếu nháp; tồn kho chưa thay đổi." };
}

async function confirmVoucher(db, u, b) {
  const v = await one(db, "SELECT * FROM vouchers WHERE id=$1 FOR UPDATE", [
    integer(b.id, "Phiếu"),
  ]);
  if (!v) fail("Không tìm thấy phiếu.", 404);
  voucherPermission(u, v.type);
  if (v.status === "confirmed")
    return { id: v.id, message: "Phiếu đã được xác nhận trước đó." };
  if (v.type === "in") await reference(db, "suppliers", v.supplier_id);
  let order = null;
  const sums = {};
  for (const l of v.lines) {
    sums[l.product_id] = (sums[l.product_id] || 0) + (l.quantity || 0);
  }
  if (v.type === "sale") {
    order = await getOrder(db, v.order_id);
    if (order.status !== "confirmed")
      fail("Đơn hàng không còn ở trạng thái đã xác nhận.", 409);
    if (
      order.lines.length !== Object.keys(sums).length ||
      order.lines.some((l) => sums[l.product_id] !== l.quantity)
    )
      fail("Phiếu xuất bán phải khớp toàn bộ và đúng số lượng của đơn hàng.");
  }
  const changes = new Map();
  for (const l of v.lines) {
    await reference(db, "locations", l.location_id);
    const key = `${l.product_id}:${l.location_id}`;
    const previous = await one(
      db,
      "SELECT quantity FROM stock WHERE product_id=$1 AND location_id=$2",
      [l.product_id, l.location_id],
    );
    const quantity = previous?.quantity || 0;
    if (v.type === "adjust" && quantity !== l.expected)
      fail(
        "Tồn kho đã thay đổi kể từ lúc kiểm kê. Vui lòng lập lại phiếu với số dư mới.",
        409,
      );
    const delta =
      v.type === "in"
        ? l.quantity
        : v.type === "adjust"
          ? l.count - quantity
          : -l.quantity;
    changes.set(key, (changes.get(key) || 0) + delta);
    if (v.type === "transfer") {
      await reference(db, "locations", l.target_id);
      const dest = `${l.product_id}:${l.target_id}`;
      changes.set(dest, (changes.get(dest) || 0) + l.quantity);
    }
  }
  if ([...changes.values()].every((n) => n === 0))
    fail("Không có chênh lệch tồn kho để ghi nhận.");
  const deltas = {};
  for (const [key, delta] of changes) {
    const [pid, lid] = key.split(":").map(Number);
    const s = await one(
      db,
      "SELECT quantity FROM stock WHERE product_id=$1 AND location_id=$2",
      [pid, lid],
    );
    if ((s?.quantity || 0) + delta < 0)
      fail(`Không đủ tồn kho tại vị trí #${lid}.`, 409);
    deltas[pid] = (deltas[pid] || 0) + delta;
  }
  for (const [pid, d] of Object.entries(deltas)) {
    const bal = await balances(db, Number(pid));
    const release = v.type === "sale" ? sums[pid] : 0;
    if (bal.actual + d < bal.reserved - release)
      fail("Xuất kho hoặc điều chỉnh làm tồn thấp hơn lượng đang giữ cho khách.", 409);
  }
  for (const [key, delta] of changes) {
    if (!delta) continue;
    const [pid, lid] = key.split(":").map(Number);
    await db.query(
      "INSERT INTO stock(product_id,location_id,quantity) VALUES($1,$2,0) ON CONFLICT DO NOTHING",
      [pid, lid],
    );
    const r = await one(
      db,
      "UPDATE stock SET quantity=quantity+$3 WHERE product_id=$1 AND location_id=$2 RETURNING quantity",
      [pid, lid, delta],
    );
    await db.query(
      "INSERT INTO movements(voucher_id,product_id,location_id,delta,balance,actor) VALUES($1,$2,$3,$4,$5,$6)",
      [v.id, pid, lid, delta, r.quantity, u.id],
    );
  }
  await db.query(
    "UPDATE vouchers SET status='confirmed',confirmed_at=NOW() WHERE id=$1",
    [v.id],
  );
  if (order) await status(db, u, order, "shipped", `Xuất kho theo phiếu #${v.id}`);
  await audit(
    db,
    u,
    "voucher.confirm",
    `voucher:${v.id}`,
    { status: "draft" },
    { status: "confirmed", type: v.type, lines: v.lines },
  );
  return { id: v.id, message: "Đã xác nhận phiếu và cập nhật tồn kho." };
}