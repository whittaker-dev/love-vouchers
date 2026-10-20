# 💌 Love Vouchers

Một trang web nhỏ để **tặng voucher tình yêu** cho bạn gái: anh (admin) tạo các voucher như *trà sữa*, *massage*, *một buổi hẹn hò*… Em mở trang, **chạm chọn bao nhiêu voucher cũng được**, viết vài dòng nhắn rồi bấm **Gửi điều ước**. Điều ước hiện thành **thông báo** trong trang quản trị; anh vào xem mỗi ngày, làm xong voucher nào thì bấm **Xong** và thông báo đó được xoá.

Toàn bộ giao diện bằng tiếng Việt, tông hồng, ưu tiên điện thoại, và mọi thao tác đều có animation (Framer Motion). Không gửi email, không upload file: avatar của em và biểu tượng voucher đều là **emoji**.

---

## Mục lục

1. [Tính năng](#tính-năng)
2. [Công nghệ](#công-nghệ)
3. [Cấu trúc monorepo](#cấu-trúc-monorepo)
4. [Chạy local từng bước](#chạy-local-từng-bước)
5. [File `.env`](#file-env)
6. [Dữ liệu ban đầu (seed tự động)](#dữ-liệu-ban-đầu-seed-tự-động)
7. [Các lệnh thường dùng](#các-lệnh-thường-dùng)
8. [Database & migration](#database--migration)
9. [API](#api)
10. [Deploy lên Render (miễn phí)](#deploy-lên-render-miễn-phí)
11. [Xử lý sự cố](#xử-lý-sự-cố)

---

## Tính năng

**Phía em (không cần đăng nhập)**

| Trang | Đường dẫn | Nội dung |
| --- | --- | --- |
| Voucher | `/` | Màn mở đầu (trái tim tự vẽ → lưới ô vuông tắt dần, ~2s) → hero có parallax → lưới voucher chọn nhiều → form "Gửi một điều ước nhỏ" (chip các voucher đã chọn + lời nhắn) → màn "Ôi, em đáng yêu quá đi!" |
| Về em | `/em` | Emoji đại diện, tên, biệt danh, lời giới thiệu, sinh nhật (đếm ngược), số ngày bên nhau, những thứ em thích |
| Đã gửi | `/da-chon` | Những điều ước **anh chưa thực hiện**. Anh làm xong cái nào thì cái đó biến mất |

**Phía anh, admin, đăng nhập bằng email + mật khẩu ở `/admin`**

| Tab | Đường dẫn | Nội dung |
| --- | --- | --- |
| Voucher | `/admin` | Danh sách, bật/ẩn, sửa, xoá; nút **+ Thêm voucher** (form có xem trước trực tiếp) |
| Thông báo | `/admin/notifications` | Các điều ước em gửi (badge đỏ = số việc đang chờ). Từng voucher: **Xong ✓** hoặc **Huỷ** (trả lại lượt); cả điều ước: **Xong hết** |
| Hồ sơ em | `/admin/profile` | Chọn **emoji đại diện**, sửa tên, biệt danh, lời giới thiệu, sinh nhật, ngày yêu, sở thích |
| Tài khoản | `/admin/account` | Đổi mật khẩu |

Mỗi voucher có: emoji, tên, mô tả, giá trị (vd `50.000đ`), điều kiện, màu thẻ, **số lượt** (hoặc không giới hạn), **hạn sử dụng**, thứ tự hiển thị, bật/ẩn. Voucher hết lượt sẽ hiện "Hết lượt rồi 🥲" và không chọn được; voucher hết hạn sẽ tự ẩn.

**Thông báo được xử lý là bị xoá khỏi database**, nên dữ liệu luôn chỉ gồm những việc còn đang chờ. Số lần mỗi voucher đã được dùng được lưu riêng (`usedCount`) nên giới hạn lượt vẫn đúng sau khi xoá.

## Công nghệ

| Phần | Dùng gì |
| --- | --- |
| Monorepo | **pnpm workspaces** (`apps/*`, `packages/*`) |
| Ngôn ngữ | **TypeScript 7** ở mọi nơi |
| Backend | **Node.js 24 + Express 5**, **Prisma 7** (driver adapter `pg`) + **PostgreSQL** |
| Xác thực | bcrypt (`bcryptjs`) + JWT trong cookie `httpOnly` (30 ngày) |
| Frontend | **React 19 + Vite 8**, **React Router 8**, **TanStack React Query 5**, **Framer Motion 14**, CSS Modules |
| Validate | **Zod 4**: cùng một schema dùng cho cả API lẫn form (`packages/shared`) |
| Hạ tầng | **Docker Compose** (Postgres) khi dev; **một Docker image** khi chạy thật (Render) |

Font: **Be Vietnam Pro** (Google Fonts), được thiết kế cho tiếng Việt nên dấu chồng (ễ, ợ, ặ) gọn gàng. Toàn bộ design system nằm trong [`design.md`](./design.md).

## Cấu trúc monorepo

```
love-vouchers/
├── apps/
│   ├── api/                    # Express API
│   │   ├── prisma/             # schema.prisma, migrations/, seed.ts
│   │   ├── prisma7.config.ts   # Prisma 7 đọc DATABASE_URL ở đây (không còn trong schema)
│   │   └── src/
│   │       ├── routes/         # public.ts (phía em), auth.ts, admin.ts
│   │       ├── app.ts          # ghép route; khi chạy thật thì phục vụ luôn web đã build
│   │       ├── bootstrap.ts    # seed tự động lúc khởi động (admin, hồ sơ, voucher ban đầu), mỗi thứ đúng 1 lần
│   │       ├── starterData.ts  # 30 voucher ban đầu + hồ sơ mặc định
│   │       ├── notifications.ts # Xong / Huỷ / Xong hết = xoá thông báo
│   │       ├── config.ts       # đọc + kiểm tra biến môi trường, sai là dừng ngay khi khởi động
│   │       └── generated/      # Prisma Client (tự sinh, không commit)
│   └── web/                    # React app
│       └── src/
│           ├── api/            # client.ts (fetch) + hooks.ts (mọi React Query hook)
│           ├── components/     # VoucherCard, WishForm, IntroLoader, HeroArt, EmojiPicker, …
│           ├── pages/          # trang của em + pages/admin/*
│           ├── lib/            # motion.ts (token chuyển động), parallax.ts, format.ts, …
│           └── styles/tokens.css  # token màu / chữ / khoảng cách
├── packages/
│   └── shared/                 # Zod schemas + kiểu DTO dùng chung cho api & web
├── .env.example                # mẫu cho file .env DUY NHẤT ở thư mục gốc
├── docker-compose.yml          # Postgres cho dev
├── Dockerfile                  # image chạy thật: API + web trong một service
├── render.yaml                 # cấu hình Render (Blueprint)
├── design.md                   # design system
└── README.md
```

Cách các phần nói chuyện với nhau:

```
DEV:        Trình duyệt ──▶ Vite :5173 ── /api/* proxy ──▶ Express :4000 ──▶ Postgres :5433 (Docker)
CHẠY THẬT:  Trình duyệt ──▶ Render: Express (phục vụ cả web đã build lẫn /api/*) ──▶ Supabase Postgres
```

Web và API luôn chạy **cùng một origin** (qua proxy khi dev, chung một server khi chạy thật), nên cookie đăng nhập hoạt động mà không cần cấu hình CORS.

## Chạy local từng bước

### 0. Cài sẵn

- **Node.js 24** trở lên: `node -v` (có `.nvmrc`, dùng `nvm use` nếu xài nvm)
- **pnpm 10**: `corepack enable` (đi kèm Node), hoặc `npm i -g pnpm@10.33.0`
- **Docker Desktop** đang chạy (dùng cho Postgres)

### 1. Cài dependencies

```bash
pnpm install
```

### 2. Tạo file `.env` ở thư mục gốc

```bash
cp .env.example .env
```

Mở `.env` và đổi:

- `JWT_SECRET`: chuỗi ngẫu nhiên dài, tạo bằng `openssl rand -base64 48`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: tài khoản admin của anh

### 3. Bật Postgres

```bash
pnpm infra:up       # Postgres ở localhost:5433 (cố ý dùng 5433 để không đụng Postgres có sẵn ở 5432)
```

### 4. Tạo bảng

```bash
pnpm db:migrate     # tạo bảng + sinh Prisma Client
```

### 5. Chạy dev

```bash
pnpm dev
```

Lệnh này build `packages/shared` rồi chạy song song: shared (watch), API (`tsx watch`, :4000) và web (Vite, :5173). **Lần đầu API khởi động sẽ tự tạo admin, hồ sơ em và 30 voucher ban đầu** (xem [seed tự động](#dữ-liệu-ban-đầu-seed-tự-động)).

### 6. Mở trình duyệt

| Gì | Ở đâu |
| --- | --- |
| Trang của em | http://localhost:5173 |
| Trang quản trị | http://localhost:5173/admin (đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`) |
| Xem DB | `pnpm db:studio` |

Thử luồng chính: mở trang em → chọn 2–3 voucher → viết lời nhắn → **Gửi điều ước** → vào `/admin/notifications` thấy thông báo → bấm **Xong ✓** từng voucher (hoặc **Xong hết**) → thông báo biến mất.

> Mở trên điện thoại cùng mạng Wi-Fi: chạy `pnpm dev` như thường, rồi ở một terminal khác chạy `pnpm --filter @love/web exec vite --host --port 5174` và vào `http://<IP-máy-tính>:5174`.

## File `.env`

Chỉ có **một file `.env` ở thư mục gốc** (mẫu: `.env.example`), gồm `DATABASE_URL`, `PORT`, `JWT_SECRET`, `COOKIE_SECURE` và `ADMIN_*`. `pnpm dev`, `pnpm db:seed` và Prisma đều đọc file này. Khi chạy trên Render, các biến được đặt trong dashboard và **luôn được ưu tiên hơn** file `.env`.

`ADMIN_NAME` là cách app gọi anh ở những chỗ dùng như tên riêng, ví dụ "Minh Tai hay gọi là "Bé"". Những chỗ xưng hô giữa câu thì luôn là "anh".

## Dữ liệu ban đầu (seed tự động)

Mỗi lần API khởi động, nó chạy `runFirstBootSetup()` (`apps/api/src/bootstrap.ts`). Mỗi bước chỉ làm **đúng 1 lần cho mỗi database**:

| Bước | Khi nào làm | Ghi chú |
| --- | --- | --- |
| Tạo admin từ `ADMIN_*` | Khi DB **chưa có admin nào** | Đã có admin thì bỏ qua (không ghi đè mật khẩu đã đổi trong trang quản trị) |
| Tạo hồ sơ em mặc định ("Bé Yêu" 🐐) | Khi **chưa có hồ sơ** | Sửa trong `/admin/profile` |
| Tạo 30 voucher ban đầu (`starterData.ts`) | **Chỉ lần đầu tiên** | Đánh dấu bằng bảng `SetupStep`. Restart, deploy lại, hay xoá hết voucher rồi khởi động lại đều **không** seed lại, không bị trùng |

Nhiều bản app khởi động cùng lúc cũng an toàn: dấu "đã seed" và việc tạo voucher nằm chung một transaction, nên chỉ một bản làm được. (Đã test: 3 tiến trình khởi động cùng lúc trên DB trống → đúng 1 admin, 30 voucher.)

`pnpm db:seed` (chạy tay) làm thêm một việc: **cập nhật admin hiện có theo `ADMIN_*` trong `.env`**. Đây cũng là cách đặt lại mật khẩu khi quên. Sau đó nó chạy đúng các bước một lần như trên.

Muốn đổi danh sách voucher ban đầu cho một database **mới**: sửa `apps/api/src/starterData.ts`. Database đã seed rồi thì sửa voucher trong trang quản trị.

## Các lệnh thường dùng

Chạy ở thư mục gốc:

| Lệnh | Làm gì |
| --- | --- |
| `pnpm dev` | Chạy shared (watch) + API + web |
| `pnpm build` | Build production cả 3 package |
| `pnpm typecheck` | Kiểm tra kiểu TypeScript toàn repo |
| `pnpm infra:up` / `pnpm infra:down` | Bật / tắt Postgres |
| `pnpm db:migrate` | Tạo migration mới từ `schema.prisma` và áp dụng (dev) |
| `pnpm db:seed` | Đồng bộ admin theo `.env` + các bước seed một lần |
| `pnpm db:reset` | **Xoá sạch** DB rồi tạo lại + seed |
| `pnpm db:studio` | Mở Prisma Studio để xem/sửa dữ liệu |

Chạy lệnh cho một package: `pnpm --filter @love/api <script>` hoặc `pnpm --filter @love/web <script>`.

Thử bản production bằng Docker ngay trên máy (giống hệt cách Render chạy):

```bash
docker build -t love-vouchers .
docker run --rm -p 10000:10000 -e PORT=10000 \
  -e DATABASE_URL="postgresql://love:love@host.docker.internal:5433/love_vouchers?schema=public" \
  -e JWT_SECRET="$(openssl rand -base64 48)" \
  love-vouchers
# mở http://localhost:10000
```

Repo hiện **chưa có test tự động và linter**. `pnpm typecheck` + `pnpm build` là các kiểm tra hiện có.

## Database & migration

Các model (xem `apps/api/prisma/schema.prisma`):

| Model | Ý nghĩa |
| --- | --- |
| `Admin` | Tài khoản anh (email, mật khẩu đã băm bcrypt). Luôn chỉ có 1 |
| `Profile` | Hồ sơ em (có `avatarEmoji`), luôn chỉ có 1 dòng (`id = 1`) |
| `Voucher` | Voucher; `quantity = null` là không giới hạn; `usedCount` là số lần đã dùng |
| `WishRequest` | Một thông báo = một lần em bấm "Gửi điều ước" (lời nhắn + các voucher) |
| `Redemption` | Một voucher **đang chờ** trong thông báo. Xong hoặc Huỷ là bị xoá |
| `SetupStep` | Đánh dấu các bước seed đã làm (vd `starter-vouchers`) để không làm lại |

- Lượt còn lại = `quantity − usedCount`. Gửi điều ước thì `usedCount + 1` (kiểm tra và tăng trong một câu lệnh, nên hai lần gửi cùng lúc không thể lấy cùng một lượt cuối); **Huỷ** thì `usedCount − 1`; **Xong** thì giữ nguyên.
- `Redemption` lưu **bản sao** tên + emoji của voucher, nên sửa hay xoá voucher không làm hỏng thông báo đang chờ.
- Ngày (sinh nhật, ngày yêu, hạn dùng) lưu dạng `DATE` và đi qua API dưới dạng chuỗi `YYYY-MM-DD`. "Hết hạn" được tính theo giờ Việt Nam (UTC+7).
- Khi chạy thật, container tự chạy `prisma migrate deploy` mỗi lần khởi động.

Đổi schema: sửa `schema.prisma` → `pnpm db:migrate` → đặt tên migration → commit thư mục `prisma/migrations/`.

## API

Mọi route đều có tiền tố `/api`, trả JSON. Lỗi có dạng `{ "error": "thông báo tiếng Việt", "fields"?: { "tên field": "lỗi" } }`.

| Method | Đường dẫn | Ai | Làm gì |
| --- | --- | --- | --- |
| GET | `/health` | ai cũng được | kiểm tra sống (Render dùng làm health check) |
| GET | `/profile` | ai cũng được | hồ sơ em + tên anh |
| GET | `/vouchers` | ai cũng được | voucher đang bật và chưa hết hạn |
| GET | `/wishes` | ai cũng được | các điều ước đang chờ |
| POST | `/wishes` | ai cũng được | `{ voucherIds: string[], message }` → tạo thông báo (giới hạn 20 lần / 15 phút) |
| POST | `/auth/login` | — | `{ email, password }` → đặt cookie (giới hạn 10 lần / 15 phút) |
| POST | `/auth/logout` | — | xoá cookie |
| GET | `/auth/me` | admin | admin hiện tại |
| PUT | `/auth/password` | admin | đổi mật khẩu |
| GET/POST | `/admin/vouchers` | admin | danh sách / tạo voucher |
| GET/PUT/DELETE | `/admin/vouchers/:id` | admin | xem / sửa / xoá voucher |
| PUT | `/admin/profile` | admin | cập nhật hồ sơ em |
| GET | `/admin/wishes` | admin | toàn bộ thông báo đang chờ |
| POST | `/admin/wishes/:id/complete` | admin | **Xong hết**: xoá cả thông báo |
| POST | `/admin/redemptions/:id/complete` | admin | **Xong**: xoá voucher khỏi thông báo, vẫn tính lượt |
| POST | `/admin/redemptions/:id/cancel` | admin | **Huỷ**: xoá voucher khỏi thông báo và trả lại lượt |

Schema đầu vào nằm ở `packages/shared/src/schemas.ts`; kiểu dữ liệu trả về nằm ở `packages/shared/src/types.ts`.

## Deploy lên Render (miễn phí)

Bộ đôi miễn phí: **Render** (chạy app) + **Supabase** (Postgres). App chạy trong **một** Docker service; file `render.yaml` đã cấu hình sẵn.

### Gói free có gì cần biết

| Giới hạn | Ảnh hưởng |
| --- | --- |
| Render free **ngủ sau 15 phút** không ai vào; lần mở tiếp theo chờ ~1 phút | Em mở link lúc server đang ngủ sẽ phải chờ. Có thể dùng dịch vụ ping miễn phí (vd cron-job.org) gọi `https://<app>.onrender.com/api/health` mỗi 10 phút: 1 service chạy cả tháng ≈ 744 giờ, vẫn nằm trong 750 giờ free/tháng |
| Supabase free **tạm dừng project sau 7 ngày** không hoạt động | Không mất dữ liệu; vào dashboard bấm Resume. Ping ở trên cũng giữ DB hoạt động |
| Supabase free **500MB** | Thừa sức: app chỉ lưu chữ và emoji, thông báo xử lý xong là bị xoá |

### Các bước

1. **Supabase:** tạo project (region **Singapore**). Vào **Connect** → chọn **Session pooler** (cổng 5432, hỗ trợ IPv4) → copy connection string, thay `[YOUR-PASSWORD]`, rồi **thêm vào cuối**:

   ```
   ?uselibpqcompat=true&sslmode=require
   ```

   Không dùng "Direct connection" (gói free chỉ có IPv6, Render không kết nối được). Không dùng "Transaction pooler" (cổng 6543, không hỗ trợ prepared statement mà Prisma cần).

2. **Đẩy code lên GitHub.**

3. **Render:** **New → Blueprint** → chọn repo → Render đọc `render.yaml` và hỏi các biến:

   | Biến | Giá trị |
   | --- | --- |
   | `DATABASE_URL` | chuỗi Supabase ở bước 1 |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | tài khoản admin (chỉ dùng để tạo admin ở lần khởi động đầu) |

   `JWT_SECRET` được Render tự tạo; `COOKIE_SECURE=true` đã đặt sẵn.

4. Chờ build xong. Lần khởi động đầu, container tự chạy migration rồi tự tạo admin, hồ sơ em và 30 voucher ban đầu. **Không cần chạy seed tay.**

5. Mở `https://<tên-service>.onrender.com`, đăng nhập `/admin`, gửi thử một điều ước và xem ở **Thông báo**.

Từ đó mỗi lần push lên nhánh chính, Render tự deploy lại. Migration mới tự chạy khi container khởi động; seed **không** chạy lại.

**Tạo Web Service thủ công thay vì Blueprint?** Điền như sau. Root Directory **để trống**, vì `Dockerfile` cần cả monorepo:

| Ô | Giá trị |
| --- | --- |
| Language / Runtime | Docker |
| Root Directory | *(để trống)* |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory | `.` |
| Health Check Path | `/api/health` |
| Environment | `DATABASE_URL`, `JWT_SECRET` (≥ 32 ký tự), `COOKIE_SECURE=true`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` |

### FE trên Vercel + BE trên Render (tuỳ chọn)

Service Render ở trên **đã phục vụ cả giao diện**, nên không bắt buộc dùng Vercel. Nếu muốn giao diện chạy từ CDN của Vercel:

1. Vercel → **Add New Project** → chọn repo → **Root Directory: `apps/web`**. Framework Vite, build command và output directory được lấy từ `apps/web/vercel.json`. Không cần biến môi trường nào.
2. Mở `apps/web/vercel.json`, đặt `destination` của rule `/api/:path*` thành **URL thật của service Render** (mặc định đang là `https://love-vouchers.onrender.com`; Render thêm hậu tố nếu tên bị trùng), rồi push.

Vercel chuyển tiếp `/api/*` sang Render nên trình duyệt vẫn chỉ thấy một domain, cookie đăng nhập hoạt động bình thường. Rule còn lại trả `index.html` cho mọi đường dẫn như `/em` hay `/admin`. Lưu ý: khi Render free đang ngủ, request API đầu tiên vẫn phải chờ nó thức dậy (~1 phút); dịch vụ ping ở trên giúp tránh việc này.

> Trang của em **không có mật khẩu**: ai có link đều xem được và gửi được điều ước (đã có giới hạn số lần gửi). Hãy chỉ gửi link cho em thôi nhé.

## Xử lý sự cố

| Triệu chứng | Cách xử lý |
| --- | --- |
| `Invalid environment configuration` khi chạy API | Thiếu hoặc sai biến trong `.env` (hoặc trong dashboard Render); dòng log cho biết biến nào. `JWT_SECRET` phải ≥ 32 ký tự. |
| Log có `No admin account yet` | Chưa đặt `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Đặt rồi khởi động lại. |
| Đăng nhập báo sai email / mật khẩu | Mật khẩu trong DB là cái lúc admin được tạo. Sửa `ADMIN_*` trong `.env` rồi chạy `pnpm db:seed` để đặt lại. Sai 10 lần trong 15 phút sẽ bị chặn tạm thời. |
| `Can't reach database server at localhost:5433` | Chưa chạy `pnpm infra:up`, hoặc Docker Desktop đang tắt. |
| Cổng 5173 / 4000 / 5433 đã bị dùng | Tắt chương trình đang chiếm cổng (`lsof -i :5173`) hoặc đổi cổng trong `vite.config.ts` / `.env` / `docker-compose.yml`. |
| Import `./generated/prisma/client.js` báo lỗi | `pnpm --filter @love/api db:generate` |
| Render: lỗi SSL / certificate khi kết nối DB | Thiếu `?uselibpqcompat=true&sslmode=require` ở cuối `DATABASE_URL`. |
| Render: không kết nối được DB (timeout / `ENETUNREACH`) | Đang dùng "Direct connection" của Supabase (chỉ IPv6); đổi sang **Session pooler**. |
| Đăng nhập xong vẫn bị đá ra | Đang chạy http nhưng `COOKIE_SECURE=true`. Ở local để `false`. |
| Vercel build báo `Cannot find module '@love/shared'` | Root Directory phải là `apps/web` và dùng script `build` có sẵn (nó build `packages/shared` trước). Đừng đổi build command thành `vite build`. |
| Vercel: trang mở được nhưng không có voucher / không đăng nhập được | `destination` của `/api/:path*` trong `apps/web/vercel.json` chưa phải URL Render thật, hoặc service Render đang lỗi / đang ngủ. |
| Muốn làm lại dữ liệu từ đầu | `pnpm db:reset` (xoá sạch!) |
