# DESIGN.md – Bài 2: Ticket Booking

**Nguyên tắc:** mọi quyết định "ai được ghế" dựa vào database, không dựa vào kiểm tra trong bộ nhớ. Khi giữ chỗ dùng khoá dòng, khi xác nhận và hủy dùng `UPDATE` có điều kiện.

## Các tình huống

**1. Đặt trùng ghế.** Giữ chỗ chạy trong một transaction: khoá dòng ghế bằng `SELECT id FROM seats WHERE id = $1 FOR UPDATE`, đánh dấu `EXPIRED` các booking quá hạn của ghế, rồi kiểm tra còn booking `PENDING`/`CONFIRMED` nào không (có thì trả 409), cuối cùng mới tạo booking. Request đến sau phải chờ khoá, khi chạy tiếp sẽ thấy booking của request trước nên nhận 409.

**2. Thanh toán hai lần.** Xác nhận là một câu `UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1 AND "userId" = $2 AND status = 'PENDING' AND "expiresAt" > now()`. Lần thứ hai không khớp điều kiện (`status` đã là `CONFIRMED`), không dòng nào được cập nhật nên trả 409.

**3. Hết hạn đúng lúc thanh toán.** Từ chối với 409. Điều kiện `"expiresAt" > now()` trong câu `UPDATE` ở trên loại request đến lúc 10:00:01 dù job dọn dẹp chưa chạy. Tôi chọn hết hạn kiểu lazy (không có job): booking quá hạn không được tính khi liệt kê ghế, và được đánh dấu `EXPIRED` khi có request chạm vào.

**4. Server sập giữa chừng.** Bảng `seats` không có cột trạng thái, ghế `SOLD`/`HELD`/`AVAILABLE` được suy ra từ `bookings`, nên không có hai nơi để lệch nhau. Giữ chỗ nằm trong transaction nên sập giữa chừng thì rollback; xác nhận và hủy chỉ là một câu `UPDATE` nên nguyên tử.

**5. Request gửi lại.** Chưa làm `Idempotency-Key`. Hiện tại request gửi lại không tạo booking trùng (ghế đã bị giữ nên nhận 409), nhưng client không nhận lại booking đã tạo. Cách làm đầy đủ: thêm cột `idempotencyKey` và ràng buộc `UNIQUE ("userId", "idempotencyKey")`, nhận key thì trả lại booking cũ.

## Thiết kế dữ liệu

- `users(id, email)`, `events(id, name, startTime, status)`, `seats(id, eventId, seatNumber, price)` với `UNIQUE (eventId, seatNumber)`.
- `bookings(id, userId, seatId, status, expiresAt, confirmedAt, createdAt, updatedAt)`, status gồm `PENDING`, `CONFIRMED`, `EXPIRED`, `CANCELLED`.
- Không lưu trạng thái ghế trong `seats` và không có `eventId` trong `bookings`: chỉ có một nơi lưu sự thật, tránh dữ liệu mâu thuẫn.
- `expiresAt` lưu theo từng booking nên đổi `HOLD_MINUTES` không ảnh hưởng booking đã tạo.

## Giới hạn còn tồn tại

- Chưa có ràng buộc ở database chặn hai booking hiệu lực cho cùng một ghế, việc chống trùng chỉ dựa vào khoá dòng trong code (có thể thêm partial unique index).
- Thời điểm hết hạn tính theo giờ của app server, không phải giờ database.
- Chưa có `Idempotency-Key`, job dọn booking quá hạn, hay booking nhiều ghế.

