# HƯỚNG DẪN CÀI ĐẶT CƠ SỞ DỮ LIỆU CỬA HÀNG BÁN SÁCH

## Bước 1: Cài đặt Phần mềm
1. **Database Server:**
   - Option A (Dễ nhất - MySQL): Tải và cài đặt **XAMPP** (bật dịch vụ MySQL lên).
   - Option B (PostgreSQL): Tải bộ cài chính thức tại `postgresql.org`.
2. **Giao diện Quản lý (Khuyên dùng):**
   - Tải phần mềm miễn phí **DBeaver** (`dbeaver.io`).

## Bước 2: Tạo Cơ sở dữ liệu & Import File
1. Mở DBeaver -> Tạo kết nối tới MySQL/PostgreSQL (Host: `localhost`, Port: `3306` hoặc `5432`, User: `root` hoặc `postgres`).
2. Mở cửa sổ SQL Editor và tạo mới database:
   ```sql
   CREATE DATABASE bookstore_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE bookstore_db;