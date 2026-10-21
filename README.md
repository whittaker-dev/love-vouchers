# 💌 Love Vouchers

Một trang web nhỏ để **tặng voucher tình yêu** cho bạn gái: anh (admin) tạo các voucher như *trà sữa*, *massage*, *một buổi hẹn hò*… Em đăng nhập bằng tài khoản anh tạo cho, **chạm chọn bao nhiêu voucher cũng được**, viết vài dòng nhắn rồi bấm **Gửi điều ước** (mặc định 3 lần mỗi tháng). Điều ước hiện thành **thông báo** trong trang quản trị; anh vào xem mỗi ngày, làm xong voucher nào thì bấm **Xong** và thông báo đó được xoá.

Mỗi ngày em có một **thẻ cào lời chúc** mới; vào các dịp (sinh nhật em, kỷ niệm, Valentine, Tết, Trung thu, Giáng sinh…) trang tự đổi **giao diện theo dịp**.

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

**Phía em (đăng nhập ở `/dang-nhap` bằng tài khoản anh tạo)**

| Trang | Đường dẫn | Nội dung |
| --- | --- | --- |
| Đăng nhập | `/dang-nhap` | "Chào em 💕": email + mật khẩu. Chưa đăng nhập thì mọi trang của em đều chuyển về đây |
| Voucher | `/` | Màn mở đầu (trái tim tự vẽ → lưới ô vuông tắt dần, ~2s) → hero có parallax → **thẻ cào lời chúc hôm nay** → lưới voucher chọn nhiều → form "Gửi một điều ước nhỏ" (chip voucher đã chọn + lời nhắn + **"Còn 2/3 lượt tháng 10"**) → màn "Ôi, em đáng yêu quá đi!" |
| Về em | `/em` | Emoji đại diện, tên, biệt danh, lời giới thiệu, sinh nhật (đếm ngược), số ngày bên nhau, những thứ em thích |
| Đã gửi | `/da-chon` | Những điều ước **anh chưa thực hiện**. Anh làm xong cái nào thì cái đó biến mất |

**Phía anh, admin, đăng nhập bằng email + mật khẩu ở `/admin`**

| Tab | Đường dẫn | Nội dung |
| --- | --- | --- |
| Voucher | `/admin` | Danh sách, bật/ẩn, sửa, xoá; nút **+ Thêm voucher** (form có xem trước trực tiếp) |
| Thông báo | `/admin/notifications` | Các điều ước em gửi (badge đỏ = số việc đang chờ). Từng voucher: **Xong ✓** hoặc **Huỷ** (trả lại lượt); cả điều ước: **Xong hết** |
| Dịp lễ | `/admin/occasions` | Các dịp đổi giao diện trang em: bật/tắt, sửa tên, emoji, hiệu ứng, ngày (dương lịch / **âm lịch** / sinh nhật em / ngày yêu), số ngày hiện trước/sau, lời chúc; **Xem thử**; thêm dịp riêng |
| Hồ sơ em | `/admin/profile` | Chọn **emoji đại diện**, sửa tên, biệt danh, lời giới thiệu, sinh nhật, ngày yêu (bộ chọn ngày riêng), sở thích |
| Tài khoản | `/admin/account` | **Tạo tài khoản cho em** (chỉ 1; muốn đổi thì xoá rồi tạo mới), **giới hạn gửi mỗi tháng**, đổi mật khẩu của anh |

Mỗi voucher có: emoji, tên, mô tả, giá trị (vd `50.000đ`), điều kiện, màu thẻ, **số lượt** (hoặc không giới hạn), **hạn sử dụng**, thứ tự hiển thị, bật/ẩn. Voucher hết lượt sẽ hiện "Hết lượt rồi 🥲" và không chọn được; voucher hết hạn sẽ tự ẩn.

**Thông báo được xử lý là bị xoá khỏi database**, nên dữ liệu luôn chỉ gồm những việc còn đang chờ. Số lần mỗi voucher đã được dùng được lưu riêng (`usedCount`) nên giới hạn lượt vẫn đúng sau khi xoá.

**Giới hạn gửi mỗi tháng:** tính theo lần bấm "Gửi điều ước" (một lần gửi nhiều voucher vẫn là 1 lần), theo tháng giờ Việt Nam, tự làm mới ngày 1. Huỷ voucher không hoàn lại lượt gửi. Số lần chỉnh ở `/admin/account` (mặc định 3).

**Tài khoản em:** chỉ có **một**, do anh tạo ở `/admin/account` (không lấy từ `.env`). Xoá tài khoản thì phiên đăng nhập của em hết hiệu lực ngay. Khi anh đang đăng nhập admin, anh cũng xem được trang của em (nút "Xem trang của em"), nhưng chỉ em mới gửi được điều ước.

**Thẻ cào lời chúc:** 119 câu chúc soạn sẵn, mỗi ngày một câu, xoay vòng nên một câu chỉ lặp lại sau đúng 119 ngày (`apps/api/src/greetings.ts`).

**Giao diện theo dịp:** ngày âm lịch (Tết, Thất tịch, Trung thu) được đổi sang dương lịch mỗi năm bằng thuật toán thiên văn (Hồ Ngọc Đức, múi giờ +7; đã đối chiếu Tết 2024–2027, Thất tịch, Trung thu 2024–2026). Hai dịp trùng ngày thì sinh nhật em > kỷ niệm > dịp lễ.

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
│   │       ├── routes/         # her.ts (phía em), auth.ts (2 vai trò: admin / em), admin.ts
│   │       ├── app.ts          # ghép route; khi chạy thật thì phục vụ luôn web đã build
│   │       ├── bootstrap.ts    # seed tự động lúc khởi động (admin, hồ sơ, voucher ban đầu), mỗi thứ đúng 1 lần
│   │       ├── starterData.ts  # 30 voucher ban đầu + hồ sơ mặc định
│   │       ├── notifications.ts # Xong / Huỷ / Xong hết = xoá thông báo
│   │       ├── quota.ts        # giới hạn gửi mỗi tháng
│   │       ├── occasions.ts    # dịp nào đang diễn ra, ngày kế tiếp
│   │       ├── lunar.ts        # đổi âm lịch → dương lịch
│   │       ├── greetings.ts    # 119 lời chúc + xoay vòng theo ngày
│   │       ├── config.ts       # đọc + kiểm tra biến môi trường, sai là dừng ngay khi khởi động
│   │       └── generated/      # Prisma Client (tự sinh, không commit)
│   └── web/                    # React app
│       └── src/
│           ├── api/            # client.ts (fetch) + hooks.ts (mọi React Query hook)
│           ├── components/     # VoucherCard, WishForm, ScratchCard, OccasionLayer, DatePicker, …
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
| Trang quản trị | http://localhost:5173/admin (đăng nhập bằng `ADMIN_EMAIL` / `ADMIN_PASSWORD` trong `.env`) |
| Trang của em | http://localhost:5173 (đăng nhập bằng tài khoản anh tạo ở `/admin/account`) |
| Xem DB | `pnpm db:studio` |

Thử luồng chính: vào `/admin/account` **tạo tài khoản cho em** → mở trang em ở cửa sổ ẩn danh, đăng nhập → cào thẻ lời chúc → chọn 2–3 voucher → viết lời nhắn → **Gửi điều ước** → vào `/admin/notifications` thấy thông báo → bấm **Xong ✓** từng voucher (hoặc **Xong hết**) → thông báo biến mất.

> Mở trên điện thoại cùng mạng Wi-Fi: chạy `pnpm dev` như thường, rồi ở một terminal khác chạy `pnpm --filter @love/web exec vite --host --port 5174` và vào `http://<IP-máy-tính>:5174`.

## File `.env`

Chỉ có **một file `.env` ở thư mục gốc** (mẫu: `.env.example`), gồm `DATABASE_URL`, `PORT`, `JWT_SECRET`, `COOKIE_SECURE` và `ADMIN_*`. `pnpm dev`, `pnpm db:seed` và Prisma đều đọc file này. Khi chạy trên Render, các biến được đặt trong dashboard và **luôn được ưu tiên hơn** file `.env`.

`ADMIN_NAME` là cách app gọi anh ở những chỗ dùng như tên riêng, ví dụ "Minh Tai hay gọi là "Bé"". Những chỗ xưng hô giữa câu thì luôn là "anh".

## Dữ liệu ban đầu (seed tự động)

Mỗi lần API khởi động, nó chạy `runFirstBootSetup()` (`apps/api/src/bootstrap.ts`). Mỗi bước chỉ làm **đúng 1 lần cho mỗi database**:

| Bước | Khi nào làm | Ghi chú |
| --- | --- | --- |
| Tạo admin từ `ADMIN_*` | Khi DB **chưa có admin nào** | Đã có admin thì bỏ qua (không ghi đè mật khẩu đã đổi trong trang quản trị) |
| Tạo cài đặt (giới hạn 3 lần/tháng) | Khi **chưa có** | Sửa trong `/admin/account` |
| Tạo hồ sơ em mặc định ("Bé Yêu" 🐐) | Khi **chưa có hồ sơ** | Sửa trong `/admin/profile` |
| Tạo 30 voucher ban đầu (`starterData.ts`) | **Chỉ lần đầu tiên** | Đánh dấu bằng bảng `SetupStep`. Restart, deploy lại, hay xoá hết voucher rồi khởi động lại đều **không** seed lại, không bị trùng |
| Tạo 12 dịp lễ mặc định (`starterData.ts`) | **Chỉ lần đầu tiên** | Cùng cơ chế đánh dấu như voucher |

**Tài khoản em không được seed**: anh tạo nó trong trang quản trị.

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
| `User` | Tài khoản đăng nhập của em. Tối đa 1, do admin tạo |
| `WishRequest` | Một thông báo = một lần em bấm "Gửi điều ước" (lời nhắn + các voucher) |
| `Redemption` | Một voucher **đang chờ** trong thông báo. Xong hoặc Huỷ là bị xoá |
| `SetupStep` | Đánh dấu các bước seed đã làm (vd `starter-vouchers`) để không làm lại |
| `AppSetting` | Cài đặt, 1 dòng: `monthlyWishLimit` |
| `MonthlyUsage` | Số lần em đã gửi theo tháng (`"2026-10"`) |
| `Occasion` | Dịp lễ: emoji, hiệu ứng, loại ngày (`solar` / `lunar` / `birthday` / `anniversary`), ngày/tháng, số ngày hiện trước/sau, lời chúc |

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
| POST | `/auth/login` · `/auth/logout` | — | đăng nhập / đăng xuất **admin** (giới hạn 10 lần sai / 15 phút) |
| GET | `/auth/me` | admin | admin hiện tại |
| PUT | `/auth/password` | admin | đổi mật khẩu admin |
| POST | `/auth/user/login` · `/auth/user/logout` | — | đăng nhập / đăng xuất **em** |
| GET | `/auth/viewer` | em hoặc admin | ai đang xem trang em (`role: "user" \| "admin"`) |
| GET | `/profile` | em hoặc admin | hồ sơ em + tên anh |
| GET | `/vouchers` | em hoặc admin | voucher đang bật và chưa hết hạn |
| GET | `/wishes` | em hoặc admin | các điều ước đang chờ |
| GET | `/wishes/quota` | em hoặc admin | lượt gửi tháng này: `{ limit, used, remaining, resetsOn }` |
| POST | `/wishes` | **chỉ em** | `{ voucherIds: string[], message }` → tạo thông báo; trừ 1 lượt gửi tháng (409 khi hết) |
| GET | `/greetings/today` | em hoặc admin | lời chúc hôm nay cho thẻ cào |
| GET | `/occasions/active` | em hoặc admin | dịp đang diễn ra (hoặc `null`); admin thêm `?preview=<id>` để xem thử |
| GET/POST | `/admin/vouchers` | admin | danh sách / tạo voucher |
| GET/PUT/DELETE | `/admin/vouchers/:id` | admin | xem / sửa / xoá voucher |
| PUT | `/admin/profile` | admin | cập nhật hồ sơ em |
| GET | `/admin/wishes` | admin | toàn bộ thông báo đang chờ |
| POST | `/admin/wishes/:id/complete` | admin | **Xong hết**: xoá cả thông báo |
| POST | `/admin/redemptions/:id/complete` | admin | **Xong**: xoá voucher khỏi thông báo, vẫn tính lượt |
| POST | `/admin/redemptions/:id/cancel` | admin | **Huỷ**: xoá voucher khỏi thông báo và trả lại lượt |
| GET/POST | `/admin/occasions` | admin | danh sách (kèm ngày kế tiếp) / thêm dịp |
| PUT/DELETE | `/admin/occasions/:id` | admin | sửa / xoá dịp |
| GET/PUT | `/admin/settings` | admin | giới hạn gửi mỗi tháng (+ số đã gửi tháng này) |
| GET / POST / DELETE | `/admin/user` | admin | xem / tạo (409 nếu đã có) / xoá tài khoản em |

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

4. Chờ build xong. Lần khởi động đầu, container tự chạy migration rồi tự tạo admin, cài đặt, hồ sơ em, 30 voucher và 12 dịp lễ ban đầu. **Không cần chạy seed tay.**

5. Mở `https://<tên-service>.onrender.com/admin`, đăng nhập, vào **Tài khoản → Tạo tài khoản cho em**, rồi gửi email + mật khẩu đó cho em.

6. Em mở `https://<tên-service>.onrender.com`, đăng nhập, gửi thử một điều ước; anh xem ở **Thông báo**.

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

> Trang của em **không có mật khẩu**: ai có link đều xem được và gửi được điều ước (đã có giới hạn số lần gửi). Hãy chỉ gửi link cho em thôi nhé.

## Xử lý sự cố

| Triệu chứng | Cách xử lý |
| --- | --- |
| `Invalid environment configuration` khi chạy API | Thiếu hoặc sai biến trong `.env` (hoặc trong dashboard Render); dòng log cho biết biến nào. `JWT_SECRET` phải ≥ 32 ký tự. |
| Log có `No admin account yet` | Chưa đặt `ADMIN_EMAIL` / `ADMIN_PASSWORD`. Đặt rồi khởi động lại. |
| Em không đăng nhập được | Kiểm tra `/admin/account` đã có tài khoản chưa. Quên mật khẩu thì xoá tài khoản rồi tạo mới. |
| Em báo "Tháng này em gửi đủ 3 lần rồi" | Đúng giới hạn tháng. Tăng ở `/admin/account → Giới hạn gửi mỗi tháng` nếu muốn. |
| Muốn xem trước giao diện một dịp | `/admin/occasions` → **Xem thử** (cần đang đăng nhập admin). |
| Đăng nhập báo sai email / mật khẩu | Mật khẩu trong DB là cái lúc admin được tạo. Sửa `ADMIN_*` trong `.env` rồi chạy `pnpm db:seed` để đặt lại. Sai 10 lần trong 15 phút sẽ bị chặn tạm thời. |
| `Can't reach database server at localhost:5433` | Chưa chạy `pnpm infra:up`, hoặc Docker Desktop đang tắt. |
| Cổng 5173 / 4000 / 5433 đã bị dùng | Tắt chương trình đang chiếm cổng (`lsof -i :5173`) hoặc đổi cổng trong `vite.config.ts` / `.env` / `docker-compose.yml`. |
| Import `./generated/prisma/client.js` báo lỗi | `pnpm --filter @love/api db:generate` |
| Render: lỗi SSL / certificate khi kết nối DB | Thiếu `?uselibpqcompat=true&sslmode=require` ở cuối `DATABASE_URL`. |
| Render: không kết nối được DB (timeout / `ENETUNREACH`) | Đang dùng "Direct connection" của Supabase (chỉ IPv6); đổi sang **Session pooler**. |
| Đăng nhập xong vẫn bị đá ra | Đang chạy http nhưng `COOKIE_SECURE=true`. Ở local để `false`. |
| Muốn làm lại dữ liệu từ đầu | `pnpm db:reset` (xoá sạch!) |
