# YANSOFT – Bài thực hành Fullstack (Fresher)

Stack: Node.js · NestJS · Next.js (App Router) · TypeScript · PostgreSQL · Prisma 7

- Bài 1 – Task Management (backend + frontend)
- Bài 2 – Ticket Booking (backend, module `booking` trong cùng project)

```
.
├── backend/            # NestJS + Prisma
│   ├── prisma/         # schema.prisma, migrations/, seed.ts
│   └── src/
│       ├── tasks/      # Bài 1
│       ├── booking/    # Bài 2
│       └── prisma/     # PrismaService / PrismaModule
├── frontend/           # Next.js (App Router) + TypeScript
├── docker/init.sql     # tạo DB test
├── docker-compose.yml  # PostgreSQL 16
├── DESIGN.md           # phân tích Bài 2
└── README.md
```

---

## 1. Cách chạy dự án từ máy trống

### Yêu cầu cài đặt

- Node.js >= 20 (đã chạy thử với Node 24)
- npm >= 10
- Docker Desktop (hoặc tự cài PostgreSQL 16, xem mục "Không dùng Docker")
- Git

### Các bước

```bash
# 1. Clone repo
git clone <url-repo>
cd <ten-repo>

# 2. Bật PostgreSQL (tạo sẵn 2 database: yansoft và yansoft_test)
docker compose up -d
docker compose ps          # service db phải ở trạng thái Up

# 3. Backend
cd backend
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
npm install                # tự chạy "prisma generate" nhờ script postinstall
npx prisma migrate deploy  # áp dụng migration vào DB
npm run db:seed            # tạo dữ liệu mẫu cho Bài 2 (chạy lại nhiều lần được)
npm run start:dev          # API chạy tại http://localhost:8080

# 4. Frontend (terminal khác)
cd frontend
cp .env.example .env.local
npm install
npm run dev                # http://localhost:3000
```

### Biến môi trường (`backend/.env.example`)

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Kết nối DB chính (`yansoft`) |
| `TEST_DATABASE_URL` | Kết nối DB dùng cho test (`yansoft_test`) |
| `HOLD_MINUTES` | Số phút giữ chỗ (mặc định 5, đặt nhỏ để dễ test hết hạn) |
| `PORT` | Cổng API (8080) |
| `WEB_ORIGIN` | Origin của frontend để bật CORS (`http://localhost:3000`) |

`frontend/.env.example`: `NEXT_PUBLIC_API_URL=http://localhost:8080`

### Chạy test

```bash
cd backend
npm test                   # unit test (không cần database)
```

> TODO: cập nhật mục này theo đúng những test bạn đã viết, ví dụ lệnh chạy test Bài 2 với PostgreSQL thật.

### Không dùng Docker

Cài PostgreSQL 16, rồi tạo user và hai database:

```sql
CREATE USER yansoft WITH PASSWORD 'yansoft' CREATEDB;
CREATE DATABASE yansoft OWNER yansoft;
CREATE DATABASE yansoft_test OWNER yansoft;
```

Các bước còn lại giữ nguyên.

### Gọi thử API Bài 2

Seed tạo sẵn: user `u1`, `u2`, `u3`; sự kiện `evt-upcoming` (UPCOMING, 12 ghế `A01`–`A12`, id ghế dạng `evt-upcoming-A01`); sự kiện `evt-finished` (FINISHED, 4 ghế `B01`–`B04`).

```bash
curl http://localhost:8080/events/evt-upcoming/seats
curl -X POST http://localhost:8080/bookings \
  -H "Content-Type: application/json" -H "x-user-id: u1" \
  -d '{"eventId":"evt-upcoming","seatId":"evt-upcoming-A01"}'
```

---

## 2. Thời gian thực tế

> TODO: điền số thật của bạn. Đề yêu cầu ghi trung thực.

| Hạng mục | Thời gian |
|---|---|
| Dựng project (Docker, NestJS, Next.js, Prisma, git) | 60 phút |
| Bài 1 – backend | 60 phút |
| Bài 1 – frontend | 30 phút |
| Bài 1 – test | 30 phút |
| Bài 2 – code | 60 phút |
|
| **Tổng** | 4h |

Ghi chú: tôi bắt đầu làm từ ngày 03/11/2026 và làm rải rác trong thời hạn nộp bài. Thời gian dựng project dài hơn mức khuyến nghị vì đây là lần đầu tôi dùng Docker và Prisma:

- Cài Docker Desktop trên Windows: phải bật tính năng Virtual Machine Platform và WSL 2,
- Cài mặc định ra Prisma 7 (cấu hình khác Prisma 6: `prisma.config.ts`, driver adapter, client sinh vào `src/generated`), nên mất thời gian tìm hiểu và chỉnh lại.
- Script seed chạy bằng `ts-node` bị lỗi với client của Prisma 7, phải chuyển sang `tsx`.
- Thư mục `backend/` có repo git lồng bên trong (do `nest new` tạo ra), phải gỡ trước khi commit.

---

## 3. Các quyết định kỹ thuật chính

- **Cấu trúc thư mục:** dùng `backend/` và `frontend/`/
- **Prisma 7 với driver adapter `@prisma/adapter-pg`:** client được sinh vào `backend/src/generated/prisma` và không commit. Script `postinstall` chạy `prisma generate`, nên `npm install` là đủ.
- **Tên bảng snake_case số nhiều** bằng `@@map` (`tasks`, `users`, `events`, `seats`, `bookings`). 
- **Tách tầng:** Controller chỉ nhận request, Service chứa logic nghiệp vụ, DTO + `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) kiểm tra dữ liệu vào. Vì `forbidNonWhitelisted`, body `PATCH /tasks/:id` có `status` tự bị 400.
- **`UpdateTaskDto` dùng `PartialType(CreateTaskDto)`** để không lặp lại quy tắc validate.
- **Lọc, tìm kiếm, phân trang ở database:** `where` + `skip`/`take` + `count` trong `$transaction`. `search` dùng `contains` với `mode: 'insensitive'` (`ILIKE`). Sắp xếp `createdAt` giảm dần, thêm `id` làm khoá phụ để thứ tự ổn định giữa các trang.
- **Bài 2 – trạng thái ghế được suy ra, không lưu.** Bảng `seats` không có cột trạng thái. Ghế `SOLD` là ghế có booking `CONFIRMED`, `HELD` là ghế có booking `PENDING` còn hạn, còn lại là `AVAILABLE`. Chỉ có một nơi lưu sự thật (bảng `bookings`), nên dữ liệu không thể lệch nhau.
- **Bài 2 – chống đặt trùng ghế:** trong một transaction, khoá dòng ghế bằng `SELECT ... FOR UPDATE`, rồi mới kiểm tra và tạo booking.
- **Bài 2 – hết hạn kiểu lazy:** không có job nền. Booking `PENDING` quá hạn được đánh dấu `EXPIRED` khi có request liên quan (giữ chỗ lại, xác nhận), và không được tính khi liệt kê ghế hay lịch sử.
- **Bài 2 – confirm và cancel dùng một câu `UPDATE` có điều kiện** (`updateMany` với `status = PENDING`, đúng chủ, chưa hết hạn), nên hai request đồng thời chỉ một cái thành công.
- **Seed chạy bằng `tsx`** thay cho `ts-node`, vì `ts-node` không đọc được các import `.js` trong client Prisma 7 sinh ra.

Chi tiết về Bài 2 xem `DESIGN.md`.

---

## 4. Các giả định

- `GET /tasks/:id`, `PATCH`, `DELETE` với id không tồn tại (kể cả id không đúng dạng uuid) đều trả 404, không kiểm tra định dạng id.
- `description` của task tối đa 2000 ký tự (đề không quy định, tự đặt).
- `search` chỉ toàn khoảng trắng được coi như không có `search`.
- `PATCH /tasks/:id` với body rỗng `{}` trả 200 và không đổi gì.
- `GET /events/:id/seats` là endpoint công khai (không cần `x-user-id`); các endpoint `/bookings/*` đều cần.
- Mã lỗi Bài 2 do tự chọn: sự kiện hoặc ghế không tồn tại: 404; sự kiện không còn mở đặt (không `UPCOMING` hoặc đã qua `startTime`): 400; ghế không còn trống, booking đã hết hạn hoặc đã ở trạng thái cuối: 409; booking của người khác khi confirm/cancel: 403.
- `HOLD_MINUTES` không hợp lệ (thiếu, không phải số dương) thì dùng mặc định 5 phút.
- Hủy một booking `PENDING` đã quá hạn nhưng chưa được đánh dấu `EXPIRED` vẫn cho phép.
- Mỗi booking giữ đúng 1 ghế (phiên bản bắt buộc).

---

## 5. Phần chưa hoàn thành hoặc còn hạn chế

> TODO: chỉnh lại danh sách này cho đúng với những gì bạn thực sự đã làm. Phần nào đã xong thì xoá khỏi đây.

- Chưa có bộ lọc lỗi toàn cục: lỗi validate vẫn ở định dạng mặc định của NestJS (`message` là mảng, có thêm `error`), chưa thống nhất hoàn toàn thành `{ statusCode, message }`.
- `PATCH /tasks/:id` với `{"title": null}` có thể trả 500: `PartialType` gắn `@IsOptional()` nên `null` lọt qua validate, rồi database từ chối. Cách sửa: dùng `@ValidateIf((_, v) => v !== undefined)` cho `title`.
- Tìm kiếm không bỏ dấu tiếng Việt (`bai` không khớp `bài`) và dùng `ILIKE '%...%'` nên không tận dụng được index thường. Khi dữ liệu lớn nên dùng `pg_trgm`.
- Không có ràng buộc ở tầng database để chặn hai booking hiệu lực cho cùng một ghế. Việc chống trùng chỉ dựa vào khoá dòng trong code. Có thể thêm partial unique index (`UNIQUE ("seatId") WHERE status IN ('PENDING','CONFIRMED')`) làm lớp bảo vệ thứ hai.
- Thời điểm hết hạn so sánh theo giờ của app server, không phải giờ database; nếu chạy nhiều server lệch đồng hồ thì có thể sai lệch nhỏ.
- Chưa có job dọn booking hết hạn; chưa làm `Idempotency-Key`, Booking nhiều ghế, trang sơ đồ ghế trên Next.js (các mục điểm cộng).
- Chưa có e2e test bằng Supertest cho Bài 1.

---

## 6. Khai báo sử dụng AI


Tôi dùng **Claude (Anthropic)** trong quá trình làm bài, cho các phần sau:

- Hướng dẫn dựng project: Docker Compose, NestJS, Next.js, Prisma, cấu hình `.env`, xử lý lỗi môi trường trên Windows.
- Gợi ý và viết mẫu code cho Bài 1 (DTO, Service, Controller, logic chuyển trạng thái, phân trang), Bài 2 (schema, seed, Guard, giữ chỗ với khoá dòng, confirm/cancel) và frontend gọi API.
- Giải thích các khái niệm (DI trong NestJS, `class-validator`, transaction, `FOR UPDATE`...).

Tôi đã tự chạy, kiểm thử bằng Postman và đọc hiểu code trước khi đưa vào repo. Các quyết định thiết kế, giả định và câu trả lời bên dưới là phần tôi đã xem xét và có thể giải thích lại trong buổi phỏng vấn.

---

## 7. Câu trả lời cho phần "Câu hỏi"

### Bài 1

**1. Logic chuyển trạng thái được đặt ở đâu? Vì sao?**

Đặt ở **Service** (`TasksService.changeStatus`), dùng một bảng tra cứu cho biết mỗi trạng thái chỉ được sang trạng thái nào:

```ts
const NEXT_STATUS = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: null };
// hợp lệ khi NEXT_STATUS[hiện tại] === trạng thái muốn chuyển tới
```

Không đặt ở Controller vì đề yêu cầu Controller không chứa nghiệp vụ, và Controller chỉ nên lo việc HTTP. Không đặt ở DTO vì DTO chỉ kiểm tra giá trị gửi lên có hợp lệ không (`status` là một trong ba giá trị), còn việc chuyển có được phép hay không phụ thuộc trạng thái hiện tại trong database, nên phải đọc dữ liệu trước. Đặt ở Service cũng giúp unit test được mà không cần HTTP. Bảng tra cứu gom cả ba luật (chỉ đi một chiều, không bỏ bước, `DONE` là điểm cuối) vào một phép so sánh duy nhất.

**2. Nếu hai người cùng đổi trạng thái một task gần như cùng lúc, có thể xảy ra vấn đề gì? Bạn xử lý thế nào?**

Nếu chỉ "đọc trạng thái, kiểm tra, rồi ghi", cả hai request cùng đọc thấy `TODO`, cùng kiểm tra hợp lệ, rồi cùng ghi. Kết quả là một thay đổi bị ghi đè lặng lẽ, hoặc một request kiểm tra dựa trên dữ liệu đã cũ.

Tôi xử lý bằng cập nhật có điều kiện (optimistic locking): `updateMany` với `where: { id, status: <trạng thái lúc đọc> }`. Tương đương `UPDATE tasks SET status = ... WHERE id = ... AND status = 'TODO'`. Chỉ một request khớp điều kiện; request còn lại có `count = 0` và nhận lỗi **409 Conflict** để client tải lại dữ liệu.

**3. Nếu có thêm 2 giờ, bạn sẽ cải thiện phần nào đầu tiên?**

Tôi sẽ bổ sung test và hoàn thiện xử lý lỗi trước: bộ lọc lỗi toàn cục để mọi lỗi cùng một định dạng, sửa trường hợp `title: null` đang trả 500, và thêm e2e test bằng Supertest cho các endpoint của Task. Đây là những phần ảnh hưởng trực tiếp đến độ tin cậy của API. Sau đó mới tính đến index hoặc `pg_trgm` cho tìm kiếm khi dữ liệu lớn. Ngoài ra tôi sẽ bổ sung thêm filter theo priority và search ở phía front-end


