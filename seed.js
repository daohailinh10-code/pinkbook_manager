import { readFile, mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { one } from "./db.js";
import { hashPassword } from "./security.js";

export async function initialize(
  db,
  { password, credentialDir = "./data", demo = true } = {},
) {
  // Chạy file schema.sql để tạo các bảng
  await db.exec(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );

  // Nếu đã có user trong hệ thống thì bỏ qua bước khởi tạo
  if (await one(db, "SELECT id FROM users LIMIT 1")) return;

  const pass =
    password ||
    process.env.OWNER_PASSWORD ||
    randomBytes(15).toString("base64url");

  // Mặc định tài khoản chủ cửa hàng dùng số điện thoại chuẩn
  const ownerPhone = "0901234567";

  await db.transaction(async (tx) => {
    // 1. Tạo tài khoản chủ cửa hàng (Owner) với Số điện thoại
    await tx.query(
      "INSERT INTO users(phone,email,name,password,role) VALUES($1,$2,$3,$4,'owner')",
      [ownerPhone, "owner@nhom31.local", "Chủ cửa hàng", await hashPassword(pass)],
    );

    // 2. Cài đặt thông tin cửa hàng sách
    await tx.query(
      "INSERT INTO settings(id,store_name,phone,address,low_stock) VALUES(1,'PinkBook Store','0901234567','Hà Nội',10)",
    );

    // 3. Khởi tạo danh mục sách & văn phòng phẩm
    await tx.query(
      "INSERT INTO categories(name,attributes) VALUES('Văn học',$1),('Kỹ năng sống',$2),('Khoa học - Công nghệ',$3),('Thiếu nhi',$4)",
      [
        JSON.stringify([
          { name: "Tác giả", unit: "" },
          { name: "Nhà xuất bản", unit: "" },
        ]),
        JSON.stringify([
          { name: "Tác giả", unit: "" },
          { name: "Số trang", unit: "trang" },
        ]),
        JSON.stringify([
          { name: "Chuyên ngành", unit: "" },
          { name: "Năm xuất bản", unit: "" },
        ]),
        JSON.stringify([
          { name: "Độ tuổi", unit: "tuổi" },
          { name: "Loại bìa", unit: "" },
        ]),
      ],
    );

    // 4. Khởi tạo vị trí lưu trữ trong kho sách
    await tx.query(
      "INSERT INTO locations(name) VALUES('Khu A • Kệ Văn Học'),('Khu B • Kệ Kỹ Năng'),('Khu C • Kho Tổng')",
    );

    // 5. Nhà cung cấp mẫu
    await tx.query(
      "INSERT INTO suppliers(name,phone,address) VALUES('Nhà Xuất Bản Trẻ','02839316289','TP. Hồ Chí Minh')",
    );

    if (demo) {
      // 6. Dữ liệu mẫu các tựa sách
      const data = [
        [
          "BK001",
          "Nhà Giả Kim",
          1,
          79000,
          "Cuốn tiểu thuyết nổi tiếng của Paulo Coelho về hành trình theo đuổi vận mệnh.",
          { "Tác giả": "Paulo Coelho", "Nhà xuất bản": "NXB Hội Nhà Văn" },
          "https://nxbhoidanvan.vn",
        ],
        [
          "BK002",
          "Đắc Nhân Tâm",
          2,
          86000,
          "Nghệ thuật thu phục lòng người và thay đổi cuộc sống của Dale Carnegie.",
          { "Tác giả": "Dale Carnegie", "Số trang": "320" },
          "",
        ],
        [
          "BK003",
          "Clean Code - Mã Sạch",
          3,
          185000,
          "Cẩm nang lập trình hướng dẫn viết code gọn gàng, dễ bảo trì.",
          { "Chuyên ngành": "Công nghệ thông tin", "Năm xuất bản": "2021" },
          "",
        ],
        [
          "BK004",
          "Dế Mèn Phiêu Lưu Ký",
          4,
          45000,
          "Tác phẩm văn học thiếu nhi kinh điển gắn liền với tuổi thơ.",
          { "Độ tuổi": "6-15", "Loại bìa": "Bìa mềm" },
          "",
        ],
      ];

      for (const [sku, name, cat, price, description, specs, datasheet] of data) {
        await tx.query(
          "INSERT INTO products(sku,name,category_id,price,description,specs,datasheet,unit) VALUES($1,$2,$3,$4,$5,$6,$7,'cuốn')",
          [
            sku,
            name,
            cat,
            price,
            description,
            JSON.stringify(specs),
            datasheet,
          ],
        );
      }

      // 7. Nhập kho ban đầu cho sách
      const lines = data.map((_, i) => ({
        product_id: i + 1,
        location_id: i < 2 ? 1 : 2,
        quantity: 50,
        cost: 0,
      }));

      const v = await one(
        tx,
        "INSERT INTO vouchers(type,status,supplier_id,reason,lines,created_by,confirmed_at) VALUES('in','confirmed',1,'Tồn kho đầu kỳ hệ thống quản lý sách PinkBook',$1,1,NOW()) RETURNING id",
        [JSON.stringify(lines)],
      );

      for (const l of lines) {
        await tx.query("INSERT INTO stock VALUES($1,$2,$3)", [
          l.product_id,
          l.location_id,
          l.quantity,
        ]);
        await tx.query(
          "INSERT INTO movements(voucher_id,product_id,location_id,delta,balance,actor) VALUES($1,$2,$3,$4,$4,1)",
          [v.id, l.product_id, l.location_id, l.quantity],
        );
      }
    }
  });

  // 8. Lưu thông tin đăng nhập vào file text để tiện theo dõi khi chạy lần đầu
  if (credentialDir) {
    await mkdir(credentialDir, { recursive: true });
    await writeFile(
      `${credentialDir}/first-login.txt`,
      `TAI KHOAN CHU CUA HANG (PINKBOOK MANAGER)\nSo dien thoại: ${ownerPhone}\nMat khau: ${pass}\n\nHãy sử dụng số điện thoại trên để đăng nhập. Đổi mật khẩu trong mục Hồ sơ sau khi đăng nhập.\n`,
      { mode: 0o600 },
    );
    console.log(
      `Đã khởi tạo thành công. Thông tin đăng nhập lưu tại: ${credentialDir}/first-login.txt`,
    );
  }

  return pass;
}