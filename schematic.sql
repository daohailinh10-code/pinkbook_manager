-- 1. BẢNG NGƯỜI DÙNG & XÁC THỰC (Đã đồng bộ phone, name, dob)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    dob DATE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer', 'employee', 'owner')),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    permissions JSONB NOT NULL DEFAULT '[]',
    address TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 2. DANH MỤC & NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    attributes JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. KHO HÀNG & SẢN PHẨM (Sách & Văn phòng phẩm)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    price NUMERIC(14,0) NOT NULL DEFAULT 0 CHECK(price >= 0),
    unit TEXT NOT NULL DEFAULT 'cuốn',
    description TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    datasheet TEXT NOT NULL DEFAULT '',
    pinout TEXT NOT NULL DEFAULT '',
    specs JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS stock (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0),
    PRIMARY KEY(product_id, location_id)
);

-- 4. GIỎ HÀNG & DANH MỤC YÊU THÍCH/BOMs
CREATE TABLE IF NOT EXISTS carts (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    lines JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS boms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    lines JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ĐƠN HÀNG & GIAO DỊCH
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    request_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'shipped', 'delivering', 'completed', 'cancelled', 'rejected')),
    recipient TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    lines JSONB NOT NULL,
    total NUMERIC(16,0) NOT NULL,
    history JSONB NOT NULL DEFAULT '[]',
    paid BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, request_key)
);

-- 6. PHIẾU KHO (VOUCHERS) & LỊCH SỬ BIẾN ĐỘNG (MOVEMENTS)
CREATE TABLE IF NOT EXISTS vouchers (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('in', 'out', 'sale', 'adjust', 'transfer')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'confirmed')),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    reference_id INTEGER REFERENCES vouchers(id) ON DELETE SET NULL,
    reason TEXT NOT NULL DEFAULT '',
    lines JSONB NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS one_sale_per_order ON vouchers(order_id) WHERE type = 'sale';

CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    voucher_id INTEGER REFERENCES vouchers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    actor INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. NHẬT KÝ HỆ THỐNG (AUDIT) & CẤU HÌNH CỬA HÀNG
CREATE TABLE IF NOT EXISTS audit (
    id SERIAL PRIMARY KEY,
    actor INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    store_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    low_stock INTEGER NOT NULL DEFAULT 10 CHECK(low_stock >= 0)
);

-- Chèn dữ liệu mặc định cấu hình cửa hàng nếu chưa có
INSERT INTO settings (id, store_name, phone, address, low_stock)
VALUES (1, 'PinkBook Store', '0901234567', 'Hà Nội', 10)
ON CONFLICT (id) DO NOTHING;

-- 8. TỐI ƯU HÓA CHỈ SỐ (INDEXES) ĐỂ TRUY VẤN NHANH
CREATE INDEX IF NOT EXISTS order_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS movement_time_idx ON movements(created_at);
CREATE INDEX IF NOT EXISTS product_category_idx ON products(category_id);
CREATE INDEX IF NOT EXISTS user_phone_idx ON users(phone);