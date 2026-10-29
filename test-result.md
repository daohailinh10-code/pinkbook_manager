Kết quả kiểm tra bản bàn giao · PinkBook Manager
Ngày: 26–27/10/2026. Môi trường: Linux, Node.js 24.22.1, PGlite 0.5.12, React 19.3.1, Vite 8.3.5. (Chưa trực tiếp chạy trên máy Windows của người dùng).

1. Kiểm thử tự động Backend
npm test: 31/31 ca đạt. Bộ test tự động dựng cơ sở dữ liệu bộ nhớ riêng, kiểm tra khắt khe toàn bộ logic nghiệp vụ và tự động đóng/xóa dữ liệu sau khi chạy:

Đăng ký tài khoản công khai không tự nâng quyền thành chủ cửa hàng.

Đăng nhập bằng số điện thoại và xác thực phiên làm việc.

Chặn khách hàng / tài khoản chưa đăng nhập / nhân viên truy cập chức năng độc quyền của chủ.

Danh sách yêu thích (BOM/Sách quan tâm) và giỏ hàng không tự động giữ tồn kho.

Đặt đơn hàng giữ số lượng sách tương ứng, chưa làm giảm tồn kho vật lý.

Gửi lại checkout cùng request_key không tạo đơn trùng; khác nội dung bị chặn.

Giá bán chốt trong đơn được bảo toàn; checkout phát hiện nếu giá sách thay đổi.

Chặn tuyệt đối việc truy cập đơn hàng hoặc danh sách của người khác.

Chặn chuyển trạng thái đơn hàng không hợp lệ.

Không cho phép hủy đơn hàng sau khi đã được xác nhận.

Phiếu kho ở trạng thái nháp không tác động đến tồn kho.

Xác nhận phiếu kho đồng thời ba lần chỉ ghi nhận một biến động duy nhất.

Không sửa phiếu kho đã xác nhận hoặc xuất bán cùng một đơn hàng lần thứ hai.

Chỉ ghi nhận doanh thu khi đơn hàng chuyển sang trạng thái hoàn thành và xác nhận đã thu tiền COD.

Hủy đơn giải phóng lượng giữ đúng một lần, bảo toàn lịch sử giao dịch.

Phiếu nhập kho chỉ tăng tồn khi xác nhận; xác nhận lặp không làm tăng thêm.

Chuyển vị trí kho bảo toàn tổng số lượng và ghi nhận lịch sử biến động hai chiều.

Phiếu kho nhiều dòng nếu có lỗi sẽ rollback toàn bộ, không thay đổi bất kỳ số dư nào.

Kiểm kê kho phát hiện số dư cũ và chặn xuất/giảm dưới mức đang giữ cho khách.

20 yêu cầu tranh chấp mua cùng một đầu sách: chỉ duy nhất một giao dịch thành công.

Nhân viên có quyền quản lý sách nhưng không được phép sửa giá bán qua payload.

Thu hồi quyền hạn của nhân viên có hiệu lực ngay lập tức với các phiên đang mở.

Khóa tài khoản thu hồi phiên đăng nhập nhưng vẫn bảo lưu lịch sử đơn hàng cũ.

Bảo vệ tài khoản chủ cửa hàng, nhật ký hệ thống (Audit Log) tuyệt đối không chứa mật khẩu hay chuỗi mã hóa hash.

Chặn số lượng âm và khoảng thời gian báo cáo bị đảo ngược (from > to).

Chặn yêu cầu thiếu CSRF header hoặc có origin lạ.

Gây lỗi hệ thống sau bước ghi thật: tự động kích hoạt transaction rollback.

Sao lưu và khôi phục sang cơ sở dữ liệu trống bảo toàn đơn hàng, kho, tài khoản; chặn restore đè dữ liệu đang có.

Xuất được hàng đang giữ của chính đơn hàng đó ngay cả khi tồn khả dụng chung bằng 0.

Thêm sách vào giỏ đồng thời không làm mất các lần tăng số lượng.

Dữ liệu file được giữ nguyên vẹn sau khi đóng/mở lại DB; cơ chế khóa tiến trình ngăn mở nhầm hai tiến trình cùng lúc.

2. Kiểm tra giao diện bằng Chromium Headless
Đã chạy luồng kiểm thử tự động trên giao diện: Tìm kiếm không dấu tên sách → Xem chi tiết → Đăng ký/Đăng nhập bằng số điện thoại → Thêm sách vào giỏ → Đặt đơn COD → Chủ cửa hàng xác nhận đơn → Lập và xác nhận phiếu xuất kho → Chuyển trạng thái đang giao → Hoàn thành → Đối chiếu báo cáo doanh thu. Không ghi nhận bất kỳ lỗi JavaScript nào trong luồng này.

Đã kiểm tra thêm biểu mẫu danh mục/thực thể sách, thêm/sửa thông tin sách, cập nhật giá bán riêng của chủ cửa hàng, tạo nhân viên, phân quyền chi tiết, nhập kho sách và chuyển dòng danh sách quan tâm sang giỏ hàng.

Đã kiểm tra giao diện render trang danh mục sách, quản lý tồn kho và báo cáo tại độ phân giải desktop 1440px; danh mục tại 390px hiển thị gọn gàng, không bị tràn ngang. (Lưu ý: Đây chưa thay thế toàn bộ nghiệm thu responsive trên mọi kích thước 360/768/1366 và trên các trình duyệt Chrome/Edge/Firefox).

3. Đóng gói & Build ứng dụng
npm run build: Thực thi thành công. Thư mục frontend/dist được đóng gói sẵn trong gói bàn giao để có thể chạy trực tiếp bằng lệnh npm start sau khi cài đặt thư viện.

4. Các hạng mục chưa kết luận hoàn tất (Cần nghiệm thu thực tế)
Hiệu năng tập dữ liệu lớn (10.000 đầu sách / 50.000 giao dịch), khảo sát trải nghiệm người dùng, chỉ tiêu RPO24h/RTO4h trên máy chủ thật, triển khai HTTPS thực tế, kết nối PostgreSQL server bên ngoài và kiểm tra đa trình duyệt. Các hạng mục này đã được ghi chú chi tiết trong file README.md và TRACEABILITY.md, và không bị đánh dấu hoàn thành chỉ dựa trên bộ test cục bộ.