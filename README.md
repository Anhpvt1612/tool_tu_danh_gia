# ViettelPost Auto Scanner Extension

Extension tự động quét mã phiếu gửi cho hệ thống kiểm kê ViettelPost.

## Tính năng

- ✅ Tự động quét mã khi tô đen text
- ✅ Tự động điền vào ô input và nhấn Tab
- ✅ Thông báo trực quan khi quét thành công
- ✅ Cấu hình độ trễ quét
- ✅ Bật/tắt dễ dàng qua popup

## Cài đặt

### Cách 1: Load Extension trực tiếp (Khuyến nghị cho test)

1. Mở Chrome/Edge browser
2. Vào địa chỉ: `chrome://extensions/` (hoặc `edge://extensions/`)
3. Bật "Developer mode" (góc trên bên phải)
4. Click "Load unpacked"
5. Chọn thư mục `extension` này
6. Extension sẽ xuất hiện trong thanh công cụ

### Cách 2: Đóng gói thành .crx (Để chia sẻ)

1. Vào `chrome://extensions/`
2. Bật "Developer mode"
3. Click "Pack extension"
4. Chọn thư mục `extension`
5. Nhấn "Pack Extension"
6. File .crx sẽ được tạo ra

## Hướng dẫn sử dụng

1. Mở trang web kiểm kê ViettelPost
2. Tô đen mã phiếu gửi trong danh sách
3. Extension sẽ tự động:
   - Copy mã
   - Điền vào ô "Mã kiện"
   - Nhấn Tab để quét
4. Tiếp tục tô đen mã tiếp theo

## Cấu hình

Click vào icon extension trên thanh công cụ để:

- Bật/tắt auto scan
- Điều chỉnh độ trễ quét (0.1s - 1s)

## Phím tắt

- **Tô đen text**: Tự động quét
- **Ctrl+C**: Copy và tự động quét

## Lưu ý

- Extension hoạt động trên tất cả trang web
- Chỉ quét mã có định dạng hợp lệ (8-20 ký tự chữ và số)
- Có thể tắt extension khi không cần dùng

## Khắc phục sự cố

### Extension không hoạt động?

1. Kiểm tra extension đã bật chưa
2. Refresh lại trang web
3. Kiểm tra console (F12) xem có lỗi không

### Không tự động quét?

1. Kiểm tra độ trễ quét (có thể tăng lên 1s)
2. Đảm bảo mã có định dạng đúng
3. Kiểm tra ô input có ID đúng không

## Version

- **v1.0** - Phiên bản đầu tiên
  - Tự động quét khi tô đen
  - Popup cấu hình
  - Thông báo trực quan

## Liên hệ & Hỗ trợ

Nếu có vấn đề hoặc góp ý, vui lòng liên hệ qua email hoặc tạo issue.

---

Made with ❤️ for ViettelPost
"# tool_tu_danh_gia" 
