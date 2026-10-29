PinkBook Manager — Website Quản lý Cửa hàng Sách · Nhóm 33
Mã nguồn cho đề tài Tra cứu, mua bán và quản lý cửa hàng sách, dựa trên các yêu cầu chức năng (FR), ca sử dụng (UC) và quy tắc nghiệp vụ (BR) đã xây dựng. Đây là bản triển khai chạy cục bộ có backend đầy đủ, xác thực bằng số điện thoại, lưu trữ dữ liệu bền vững và kiểm thử nghiệp vụ chuyên sâu; không chỉ là giao diện giả lập trên trình duyệt.

1. Hướng dẫn chạy trên Windows (Làm lần lượt từng bước)
Giải nén toàn bộ file ZIP ra một thư mục mới (ví dụ: D:\CODE\pinkbook-manager). Không chép đè các file mẫu cũ; dự án này có cấu trúc và backend riêng.

Mở phần mềm VS Code → Chọn File → Open Folder → Chọn thư mục chứa file package.json.

Nếu bạn đang mở phiên bản website cũ, hãy dừng Terminal bằng tổ hợp phím Ctrl + C để tránh xung đột cổng mạng 5173.

Mở Terminal trong VS Code, chuyển kiểu Terminal sang Command Prompt (tránh lỗi PowerShell chặn lệnh npm.ps1).

Cài đặt chính xác các thư viện dựa theo lockfile:

DOS
npm ci
Khởi động đồng thời cả frontend và backend ở chế độ phát triển:

DOS
npm run dev
Truy cập trình duyệt tại địa chỉ: http://localhost:5173/.(Nếu Vite chọn cổng khác do bị chiếm dụng, hãy tắt ứng dụng đang dùng cổng 5173 và chạy lại. API chỉ cho phép các nguồn/origin đã được cấu hình).

Giữ nguyên cửa sổ Terminal đang chạy. Trong những lần làm việc sau, bạn chỉ cần mở lại thư mục và chạy lệnh npm run dev (không cần chạy lại npm ci).

Yêu cầu hệ thống: Node.js phiên bản 24 trở lên, npm, và trình duyệt web hiện đại. Kết nối Internet chỉ bắt buộc ở lần chạy lệnh npm ci đầu tiên. Font chữ Google là tùy chọn; các liên kết hình ảnh bên ngoài cần có mạng để hiển thị.

2. Đăng nhập và dữ liệu khởi tạo mẫu
Trong lần chạy đầu tiên, hệ thống tự động khởi tạo:

Tài khoản Chủ cửa hàng (Owner):

Định danh đăng nhập bằng Số điện thoại: 0901234567 (hoặc email: owner@nhom33.local).

Mật khẩu ngẫu nhiên an toàn được tự động ghi vào file data/first-login.txt (bạn có thể mở file này trực tiếp bằng VS Code). Không có mật khẩu cứng chung trong mã nguồn.

Dữ liệu mẫu khởi tạo: Các đầu sách phong phú (như Nhà Giả Kim, Đắc Nhân Tâm, Clean Code...), 4 danh mục sách, 3 vị trí kho, 1 nhà cung cấp mẫu và phiếu nhập tồn đầu kỳ có lịch sử chi tiết.

Khách hàng: Bấm nút Đăng nhập → Chọn Đăng ký (cung cấp Họ tên, Ngày sinh, Số điện thoại và Mật khẩu). Các tài khoản đăng ký công khai qua giao diện chỉ cấp quyền vai trò Khách hàng.

Nhân viên: Chủ cửa hàng đăng nhập, vào mục quản lý tài khoản để tạo nhân viên và phân quyền chi tiết. Các tài khoản nhân viên mới tạo chưa có quyền nghiệp vụ mặc định.

Đổi mật khẩu: Thực hiện tại mục Hồ sơ. Việc thay đổi mật khẩu sẽ tự động vô hiệu hóa và đăng xuất toàn bộ các phiên hoạt động cũ của tài khoản đó.

Bảo mật: Tuyệt đối không chia sẻ file data/first-login.txt, file .env, thư mục data hoặc các bản sao lưu.

3. Các phân hệ màn hình chính
Dành cho Khách hàng:

Tra cứu danh mục sách, tìm kiếm linh hoạt theo tên/mã, bộ lọc theo danh mục, khoảng giá và tồn kho.

Xem chi tiết sách, hình ảnh minh họa qua URL.

Quản lý danh sách yêu thích/BOM kèm số lượng và ghi chú cá nhân; chuyển nhanh các dòng sang giỏ hàng.

Giỏ hàng lưu trữ bền vững theo tài khoản, đặt hàng hình thức COD, xem lại lịch sử và hủy đơn hàng ở trạng thái chờ xác nhận.

Dành cho Nhân viên (Theo quyền hạn được phân):

Thêm/sửa thông tin chi tiết sách và trạng thái kinh doanh.

Cấu hình danh mục, thuộc tính sách, nhà cung cấp và vị trí kho.

Quản lý tồn kho thực tế, lượng hàng đang giữ (reserved) và lượng khả dụng (available).

Lập phiếu nhập kho, xuất kho, xuất bán theo đơn, chuyển vị trí kho.

Tra cứu nhật ký biến động kho (movements).

Xác nhận hoặc từ chối đơn hàng, cập nhật các mốc trạng thái vận chuyển.

Dành cho Chủ cửa hàng (Owner):

Toàn quyền thao tác như nhân viên, kèm theo các đặc quyền quản trị: cập nhật giá bán sách riêng biệt, điều chỉnh kho sau kiểm kê thực tế.

Tạo/sửa tài khoản nhân viên, cấp/thu hồi quyền hạn chi tiết, khóa hoặc mở khóa tài khoản khách hàng/nhân viên.

Xem nhật ký hệ thống toàn diện trước–sau (Audit Log).

Thống kê báo cáo doanh thu chi tiết theo khoảng thời gian.

Cấu hình thông tin cửa hàng và ngưỡng cảnh báo tồn kho thấp (low stock).

4. Hướng dẫn kiểm thử quy trình nghiệp vụ mẫu (Demo)
Đăng ký một tài khoản Khách hàng mới bằng Số điện thoại.

Thêm đầu sách BK001 (Nhà Giả Kim) vào giỏ hàng.

Điền thông tin người nhận, số điện thoại, địa chỉ nhận sách và tiến hành đặt đơn COD.

Kiểm tra đơn hàng trong trạng thái Chờ xác nhận. (Lưu ý: Lúc này tồn kho vật lý chưa giảm, nhưng lượng giữ reserved đã tăng lên).

Đăng nhập bằng tài khoản Chủ cửa hàng hoặc Nhân viên có quyền tương ứng → Mở quản lý đơn hàng → Bấm Xác nhận.

Lập phiếu xuất kho dựa trên đơn hàng → Chọn vị trí kho còn đủ số lượng tồn → Lưu ở trạng thái Nháp.

Chuyển sang mục Phiếu nhập–xuất → Mở phiếu và bấm Xác nhận phiếu. (Lúc này tồn kho vật lý và lượng giữ đồng thời giảm, trạng thái đơn hàng tự động chuyển sang Đã xuất kho).

Cập nhật trạng thái đơn hàng sang Đang giao → Hoàn thành / Đã thu tiền COD.

Chủ cửa hàng mở mục Báo cáo bán hàng, chọn khoảng thời gian chứa ngày hoàn thành đơn để xem tổng doanh thu (doanh thu tính theo đơn giá đã chốt tại thời điểm đặt).

Thử nghiệm kịch bản khách hàng đặt đơn khác nhưng tiến hành Hủy đơn ngay khi đang ở trạng thái Chờ xác nhận: lượng giữ được giải phóng hoàn toàn và không làm ảnh hưởng đến tồn kho vật lý.

5. Quản lý Nhập, Xuất và Kiểm kê Kho
Nhập kho: Chọn nhà cung cấp, mã sách, vị trí lưu kho, số lượng, giá nhập → Lưu nháp → Xác nhận.

Xuất khác (Xuất nội bộ/hủy): Nhập lý do, mã sách, vị trí, số lượng → Lưu nháp → Xác nhận.

Xuất theo đơn hàng: Xuất toàn bộ sách trong đơn trong một lần. Tổng số lượng phải khớp chính xác với đơn hàng.

Chuyển vị trí kho: Chọn vị trí đi và vị trí đến khác nhau; bảo toàn tổng số lượng tồn, hệ thống tự động ghi nhận lịch sử biến động.

Kiểm kê kho: Chỉ dành cho Chủ cửa hàng; chọn mã sách, vị trí, số đếm thực tế, lý do và phiếu gốc (nếu điều chỉnh sai sót).

Tính bất biến của dữ liệu: Các phiếu kho đã xác nhận không thể chỉnh sửa trực tiếp. Nếu phát sinh sai sót, bắt buộc phải lập một phiếu điều chỉnh mới có tham chiếu ngược lại phiếu cũ.

6. Cấu trúc mã nguồn dự án
frontend/src/App.jsx: Khung giao diện chính, định tuyến trang và quản lý đăng nhập phía client.

frontend/src/Catalog.jsx: Quản lý danh mục, bộ lọc và chi tiết sách.

frontend/src/Customer.jsx: Quản lý giỏ hàng, danh sách yêu thích và đơn hàng cá nhân.

frontend/src/Manage.jsx: Giao diện quản trị, quản lý kho, báo cáo thống kê và phân quyền tài khoản.

frontend/src/common.jsx: Các thành phần giao diện dùng chung và hàm gọi API; kèm file style.css.

server/app.js: Xử lý HTTP API, quản lý phiên cookie bảo mật qua số điện thoại, chống CSRF và giới hạn tần suất thử đăng nhập.

server/service.js: Logic nghiệp vụ lõi và kiểm soát phân quyền phía máy chủ; toàn bộ câu lệnh chạy trong transaction an toàn.

server/schema.sql: Định nghĩa cấu trúc bảng, ràng buộc và chỉ mục tối ưu (hỗ trợ cột phone, dob).

server/db.js: Lớp adapter tương thích linh hoạt giữa PostgreSQL chuẩn và cơ sở dữ liệu nhúng PGlite.

server/seed.js: Script tự động khởi tạo tài khoản chủ cửa hàng và nạp dữ liệu mẫu chạy một lần duy nhất.

tests/business.test.js: Bộ kiểm thử tự động toàn diện về nghiệp vụ và HTTP API.

7. Cơ sở dữ liệu và phạm vi triển khai
Mặc định hệ thống sử dụng PGlite (PostgreSQL nhúng chạy qua WebAssembly trực tiếp bên trong tiến trình Node.js), dữ liệu được lưu trữ an toàn tại thư mục data/db. Bạn không cần cài đặt thêm bất kỳ phần mềm quản trị CSDL nào bên ngoài để chạy thử nghiệm.

Cơ chế lưu trữ: Dữ liệu được ghi bền vững xuống ổ cứng, không mất đi khi khởi động lại ứng dụng.

Sử dụng PostgreSQL riêng:

Cài đặt PostgreSQL và tạo một database trống (ví dụ đặt tên là nhom33).

Sao chép file .env.example thành .env ngay tại thư mục gốc.

Cấu hình biến: `DATABASE