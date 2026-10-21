# Design system: Love Vouchers

Tài liệu này là **nguồn chuẩn** cho giao diện. Code hiện thực nó ở hai chỗ:

- `apps/web/src/styles/tokens.css`: token màu, chữ, khoảng cách, bo góc, bóng (CSS)
- `apps/web/src/lib/motion.ts`: token chuyển động (Framer Motion)

Đổi một giá trị thì sửa token ở đó **và** cập nhật bảng tương ứng ở đây. Không viết mã màu, cỡ chữ hay easing "cứng" trong component; nếu cần giá trị mới, thêm token trước.

---

## 1. Tinh thần

> Một tấm thiệp tay màu hồng: mềm, ngọt, hơi tinh nghịch, nhưng gọn gàng.

- **Hồng là chủ đạo**: nền hồng rất nhạt, chữ tiêu đề màu mận đậm, điểm nhấn hồng đậm (rose).
- **Đồ vật "dán" trên trang**: thẻ, nút, chip đều ngồi trên một **bóng phẳng lệch xuống 5px** (không blur), như sticker. Bấm vào thì "lún" xuống bóng.
- **Chữ đậm, to, khít**: tiêu đề weight 900, letter-spacing âm.
- **Ưu tiên điện thoại**: em sẽ mở bằng điện thoại. Mọi màn hình được thiết kế ở 390px trước, desktop sau.
- **Mọi thao tác đều có chuyển động** (xem §6).

Lấy cảm hứng từ trang mẫu Hatchable "Love Vouchers" (bố cục, thẻ chọn nhiều, form danh sách ước, tông hồng), kết hợp nhịp hiệu ứng mượt kiểu editorial.

## 2. Màu

### Nền & chữ

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--color-bg` | `#fff5f8` | Nền trang |
| `--color-surface` | `#fffafd` | Thẻ lớn, form, topbar |
| `--color-text` | `#442b35` | Chữ thường |
| `--color-text-soft` | `#6b4f5a` | Mô tả, chữ phụ |
| `--color-muted` | `#9a7a86` | Gợi ý, placeholder, meta |
| `--color-heading` | `#6f2945` | Mọi tiêu đề, tên voucher |
| `--color-line` | `#f0c9d7` | Viền mặc định |
| `--color-line-strong` | `#e6aec2` | Viền khi hover, viền nét đứt |
| `--color-overlay` | `rgba(84,36,56,.66)` | Nền mờ sau modal |

### Điểm nhấn

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--color-accent` | `#e85d80` | Nút chính, viền thẻ đang chọn, eyebrow, tab đang mở |
| `--color-accent-hover` | `#dc4b71` | Hover của nút chính |
| `--color-accent-soft` | `#ffe3ec` | Nền icon, chip, focus ring |
| `--color-accent-shadow` | `#f5c8d7` | Bóng lệch của nút chính |
| `--color-selected` | `#ffd4e1` | Nền thẻ voucher đang được chọn |
| `--color-selected-shadow` | `#eeb1c4` | Bóng lệch của thẻ đang chọn |

### Màu thẻ voucher

Admin chọn một trong 5 màu; key khớp với `VOUCHER_COLORS` trong `packages/shared`.

| Key | Token | Giá trị | Tên hiển thị |
| --- | --- | --- | --- |
| `blush` | `--card-blush` | `#ffe3ec` | Hồng phấn |
| `cream` | `--card-cream` | `#fffafd` | Trắng kem |
| `mauve` | `--card-mauve` | `#fcecf5` | Hồng tím |
| `peach` | `--card-peach` | `#ffece4` | Hồng đào |
| `lilac` | `--card-lilac` | `#f6ecfd` | Tím nhạt |

Thêm màu mới: thêm key vào `VOUCHER_COLORS`, thêm token `--card-<key>`, thêm luật `[data-color="<key>"]` trong `VoucherCard.module.css` và `VouchersPage.module.css`, thêm nhãn trong `VoucherEditPage.tsx`.

### Trạng thái

| Token | Giá trị | Dùng cho |
| --- | --- | --- |
| `--color-success` / `-soft` | `#3f8a5c` / `#e1f3e7` | "Đã thực hiện" |
| `--color-warning` / `-soft` | `#b26a1d` / `#fdf0dc` | Cảnh báo |
| `--color-danger` / `-soft` | `#c73650` / `#fde2e7` | Lỗi, nút xoá |

Hình minh hoạ hero (`HeroArt`) cố ý dùng thêm vàng `#ffe36e` và viền đen `#1f1418`: đây là điểm nhấn duy nhất ngoài bảng màu hồng, chỉ dùng ở đó.

## 3. Chữ

Một họ chữ duy nhất: **Be Vietnam Pro** (Google Fonts, weight 400/500/700/800/900 + italic 500).

Vì sao: font mẫu (DM Sans) **không có bộ ký tự tiếng Việt**, dấu sẽ rơi về font hệ thống. Be Vietnam Pro được thiết kế cho tiếng Việt, cùng phong cách geometric, có weight 900. Những font serif đẹp như Instrument Serif, DM Serif Display, Bodoni Moda cũng **không** hỗ trợ tiếng Việt. Muốn thêm font mới, kiểm tra subset `vietnamese` trước.

| Token | Cỡ | Dùng cho |
| --- | --- | --- |
| `--text-hero` | `clamp(2.75rem, 7vw + .5rem, 6rem)` | Tiêu đề hero, tên em |
| `--text-3xl` | `clamp(2rem, 3vw + 1rem, 2.875rem)` | Tiêu đề section, tiêu đề trang admin |
| `--text-2xl` | `1.75rem` | Tiêu đề phụ |
| `--text-xl` | `1.25rem` | Tên voucher, logo |
| `--text-lg` | `1.125rem` | |
| `--text-base` | `0.9375rem` (15px) | Chữ thường |
| `--text-sm` | `0.875rem` | Nhãn form, nút |
| `--text-xs` | `0.75rem` | Meta, chip |
| `--text-2xs` | `0.6875rem` | Eyebrow, nhãn nhỏ |

Quy tắc:

- Tiêu đề (`h1–h3`): weight **900**, màu `--color-heading`, `letter-spacing: -0.035em` (hero: `-0.045em`), `line-height ≈ 1–1.1`.
- **Eyebrow** (`.eyebrow`): chữ HOA, `--text-2xs`, weight 800, `letter-spacing: .16em`, màu accent. Đặt trên mỗi tiêu đề section ("NHỮNG ĐIỀU NGỌT NGÀO", "DANH SÁCH ƯỚC").
- Trên điện thoại, ô nhập liệu luôn **16px** (dưới 16px thì iOS Safari tự zoom khi focus).
- Tiêu đề lớn hiện bằng `RevealText`: mặt nạ có padding dọc để dấu chồng (ễ, ợ) không bị cắt.

## 4. Khoảng cách, bo góc, bóng

**Khoảng cách**: lưới 4px (`--space-1` = 4px … `--space-24` = 96px). Lề ngang trang `--gutter` = `clamp(16px, 4vw, 40px)`; nội dung rộng tối đa `--content-width` = 1180px.

| Bo góc | Giá trị | Dùng cho |
| --- | --- | --- |
| `--radius-sm` | 8px | Nhãn nhỏ |
| `--radius-md` | 14px | Ô nhập, chip box, item trong danh sách |
| `--radius-card` | 19px | Thẻ voucher, thẻ lịch sử |
| `--radius-lg` | 24px | Form lớn, modal |
| `--radius-pill` | 999px | Nút, chip, tab |

| Bóng | Giá trị | Dùng cho |
| --- | --- | --- |
| `--shadow-offset` | `0 5px 0 #f7dfe7` | **Chữ ký**: mọi thẻ / chip "dán" trên trang |
| `--shadow-offset-selected` | `0 5px 0 #eeb1c4` | Thẻ đang chọn |
| `--shadow-button` | `0 5px 0 #f5c8d7` | Nút chính |
| `--shadow-soft` | `0 12px 36px rgba(155,49,91,.07)` | Khối lớn (form ước, login) |
| `--shadow-pop` | `0 18px 55px rgba(57,19,30,.19)` | Modal, thanh nổi |

Nhãn nghiêng kiểu sticker ("MỘT LỜI NHẮN NHỎ ✦", ghi chú "của anh mãi mãi"): nền trắng, viền 1.5px, bóng lệch chéo `4px 4px 0`, xoay −3°…12°.

## 5. Thành phần

| Component | File | Ghi chú |
| --- | --- | --- |
| Button | `components/Button.tsx` | `primary` (rose), `secondary` (trắng viền hồng), `ghost`, `danger`; `sm/md/lg`; `block`; `loading` đổi nhãn thành spinner có animation. Link trông như nút: `buttonClassName()`, không bọc `<button>` trong `<a>`. |
| VoucherCard | `components/VoucherCard.tsx` | Desktop: thẻ dọc 190px, checkbox tròn góc phải. **≤560px: thẻ ngang** (ô emoji 56px bên trái). Trạng thái: thường / đang chọn / hết lượt. |
| WishForm | `components/WishForm.tsx` | Icon tim, eyebrow, tiêu đề, chip box nét đứt, textarea có đếm ký tự (đổi màu khi gần 1000), nút gửi full width, chú thích nhỏ. |
| SuccessOverlay | `components/SuccessOverlay.tsx` | Phong bì rơi xuống, tim bung ra, chữ hiện lần lượt. |
| SelectionBar | `components/SelectionBar.tsx` | Viên thuốc nổi "N đã chọn · Gửi điều ước ♡", chỉ hiện khi đang xem lưới voucher mà form chưa hiện. |
| IntroLoader | `components/IntroLoader.tsx` | Màn mở đầu ~2s, kết thúc bằng lưới ô vuông tắt dần (xem §6). |
| FloatingHearts, ScrollProgress | `components/*` | Lớp trang trí parallax và thanh tiến độ cuộn. Ẩn tim trang trí ở ≤640px. |
| Field / Input / Textarea / FormError | `components/Field.tsx` | Lỗi trượt ra; ô sai thì rung nhẹ. |
| EmojiPicker | `components/EmojiPicker.tsx` | Ô xem trước lớn + ô gõ emoji tự do + hàng emoji chọn nhanh. Dùng cho biểu tượng voucher và emoji đại diện của em (app không có upload ảnh). |
| Switch, Avatar, StateViews | `components/*` | Avatar là emoji trên nền hồng phấn; skeleton màu hồng shimmer; EmptyState viền nét đứt. |
| DatePicker | `components/DatePicker.tsx` | Thay mọi `<input type="date">`. Ô bấm mở lịch 3 cấp: **ngày → tháng → năm** (bấm tiêu đề để lên cấp), đổi tháng thì lưới trượt ngang theo hướng, ngày chọn có viên hồng `layoutId`. Desktop: popover dưới ô; **≤640px: bottom sheet** kéo lên từ đáy (portal ra `body`). Có `min` (vd. hạn voucher không trước hôm nay) và `startView` (ngày sinh mở thẳng ở cấp năm). |
| DayMonthPicker | `components/DayMonthPicker.tsx` | Ngày lặp hằng năm (không có năm) cho dịp lễ: hàng chip tháng + lưới ngày; âm lịch tối đa 30 ngày, dương lịch theo tháng (cho 29/2). Rộng tối đa 420px. |
| ScratchCard | `components/ScratchCard.tsx` | **Thẻ cào may mắn** mỗi ngày trên trang chủ: lớp foil hồng vẽ trên `<canvas>`, cào bằng ngón tay/chuột (`destination-out`), cào được 50% thì foil tan ra và lời chúc pop lên. Có nút "Mở luôn". Đã cào hôm nay thì nhớ trong `localStorage` (`lv-scratched:<ngày>`). |
| OccasionLayer | `components/OccasionLayer.tsx` | Khi đang trong một dịp: banner dưới header (emoji + tên + lời nhắn, có nút đóng, nhớ trong `localStorage`) và lớp hạt emoji phủ màn hình (portal, `pointer-events: none`; 22 hạt, điện thoại 12). Kiểu hạt và chuyển động theo `lib/occasionThemes.ts`. |
| UserLoginPage | `pages/UserLoginPage.tsx` | Trang đăng nhập của em ("Chào em 💕"), cùng tông với trang chủ. `RequireViewer` đưa người chưa đăng nhập về đây, giữ `?next=` (chỉ nhận đường dẫn trang em). |
| Thanh lượt gửi | `WishForm.tsx` | Viên "Còn N/M lượt tháng X" trong form; hết lượt thì nút khoá và hiện lời nhắn ngày làm mới. |

## 6. Chuyển động

**Quy tắc bắt buộc: mọi thao tác đều có phản hồi chuyển động.** Hover, bấm, chọn/bỏ chọn, thêm/xoá, gửi, lỗi, chuyển trang, lưu, bật/tắt. Thêm control mới mà không có animation là chưa xong.

### Token (`lib/motion.ts`)

| Tên | Giá trị | Dùng cho |
| --- | --- | --- |
| `easeOut` | `[0.22, 1, 0.36, 1]` | Mọi thứ xuất hiện (vào nhanh, dừng êm) |
| `duration.fast / base / slow` | 0.2 / 0.45 / 0.8s | Thoát / chuyển trạng thái / xuất hiện lớn |
| `spring.snappy` | stiffness 420, damping 32 | Hover, bấm, thanh trượt tab |
| `spring.soft` | 220 / 28 | Khối lớn di chuyển, layout |
| `spring.bouncy` | 380 / 16 | Chip, dấu ✓, sticker, đồ "pop" |
| `fadeUp`, `staggerChildren()` | | Các phần tử hiện lần lượt khi cuộn tới |
| `pageTransition` | fade + trượt 12px + blur 6px | Chuyển trang |

CSS dùng `--ease-out`, `--duration-fast` (150ms), `--duration-base` (250ms) cho đổi màu/viền/bóng.

### Danh mục hiệu ứng

| Khi | Hiệu ứng |
| --- | --- |
| Mở trang (lần đầu) | `IntroLoader`: viền tim tự vẽ (`pathLength`) → tô hồng + đập, chữ "love vouchers" hiện từng ký tự kèm blur → màn hình **vỡ thành lưới ô vuông tắt dần từng ô**, lan từ giữa ra ngoài (mỗi ô co lại, xoay 45° và bo tròn thành chấm), trang hiện ra qua các khe. Giữ ít nhất 1.3s, chờ dữ liệu tối đa 4s; tổng thể ~2s. Hiệu ứng vào trang chờ `useIntroDone()`. |
| Tiêu đề lớn | `RevealText`: từng chữ trượt lên từ sau mặt nạ, xoay nhẹ 6°→0 |
| Hero art | Lớp hình trôi theo chuột (parallax), blob đổi hình liên tục, sparkle nhấp nháy, tim đập |
| Cuộn trang | **Parallax**: chữ hero đi lên −80px, hình hero −180px + xoay −8°, cả hai mờ dần; tim/sao trang trí quanh lưới voucher trôi mỗi cái một tốc độ (`FloatingHearts`); thanh tiến độ hồng 3px ở mép trên (`ScrollProgress`). Mọi giá trị parallax đi qua `useParallax()` (có spring, tự tắt khi giảm chuyển động). |
| Card / khối xuất hiện | **Mỗi thẻ voucher tự xuất hiện** khi cuộn tới (trượt lên 48px, scale .94→1, nghiêng ±2° xen kẽ, trễ theo cột). Tiêu đề section reveal từng chữ khi vào màn hình. Form "Gửi một điều ước nhỏ" trượt lên rồi từng phần bên trong hiện lần lượt. Thẻ lịch sử cũng hiện từng cái. |
| Hover nút / thẻ | Nhấc lên 2–3px (spring snappy) |
| Bấm nút / thẻ | Lún xuống 3–4px, bóng lệch co lại còn 1px |
| Chọn voucher | Nền + viền đổi màu, ✓ xoay-pop (spring bouncy), emoji nhảy lên + xoay; bỏ chọn: emoji co lại |
| Bộ đếm "N đã chọn" | Số lật lên/xuống, viên thuốc đổi sang rose |
| Chip trong danh sách ước | Pop vào (scale .4→1), xoá thì co lại, các chip khác dời chỗ mượt (`layout`) |
| Gửi khi chưa chọn | Chip box rung ngang + chữ nhắc đổi màu |
| Gửi thành công | Overlay: phong bì rơi + nảy, 14 trái tim bung ra, chữ hiện lần lượt, tim đập lặp |
| Đổi tab / bộ lọc | Viên nền trượt sang (`layoutId`) |
| Chuyển trang | `pageTransition`, rồi cuộn lên đầu sau khi trang cũ đã đi |
| Lỗi field | Chữ lỗi trượt ra (height auto), ô nhập rung |
| Lưu thành công (admin) | "✓ Đã lưu" trượt vào |
| Xoá voucher (admin) | Hỏi lại tại chỗ (scale-in), dòng bay sang trái khi xoá, danh sách dồn lên |
| Xử lý thông báo (admin) | **Xong**: dòng bay sang phải, nền xanh. **Huỷ**: hỏi lại tại chỗ, rồi dòng co lại. Thông báo xử lý hết thì cả thẻ thu nhỏ và biến mất; bộ đếm "N việc đang chờ" pop sang số mới |
| Chọn emoji | Emoji mới xoay-pop vào ô xem trước, emoji cũ xoay ra |
| Mở DatePicker | Popover trượt xuống + scale-in từ ô bấm (điện thoại: sheet trượt lên từ đáy); icon lịch xoay-pop. Đổi tháng/năm hoặc đổi cấp ngày ↔ tháng ↔ năm: lưới trượt ngang theo hướng, tiêu đề lật lên/xuống |
| Chọn ngày / tháng | Viên hồng lướt tới ô mới (`layoutId`), ô bấm lún xuống; ô ngày của DayMonthPicker pop vào lần lượt khi đổi tháng |
| Cào thẻ may mắn | Foil mất dần theo nét cào; qua 50% thì foil phóng to + blur rồi biến mất, emoji pop-xoay, lời chúc trượt lên |
| Dịp lễ | Hạt emoji rơi (`fall`, có lắc), bay lên (`rise`), nhấp nháy (`twinkle`) hoặc bung như pháo hoa (`burst`), bằng CSS keyframes; banner trượt vào, emoji lắc lư, đóng thì banner biến mất |
| Lượt gửi | Số lượt còn lại lật lên khi đổi; hết lượt thì viên đổi màu, nút gửi bị khoá và lời nhắn ngày làm mới hiện ra |
| Đăng nhập em | Thẻ đăng nhập trượt lên + scale-in, icon xoay-pop, emoji trang trí bay lên nền |

### Lưu ý kỹ thuật

- `MotionConfig reducedMotion="user"` bọc toàn app; IntroLoader, HeartBurst và các vòng lặp CSS tự tắt khi người dùng bật "giảm chuyển động".
- Wrapper chuyển trang animate `filter`, nên **mọi thứ `position: fixed` phải portal ra `document.body`** (như `SelectionBar`, `SuccessOverlay`), nếu không nó sẽ dính vào trang thay vì màn hình.
- Vòng lặp liên tục (xoay, blob) dùng CSS `@keyframes` (chạy trên compositor). Còn tương tác thì dùng Framer.
- Giá trị gắn với scroll (`useScroll` / `useTransform`) **không** bị `MotionConfig reducedMotion` tắt, nên luôn đi qua `useParallax()`.
- Hiệu ứng xuất hiện gắn trên **từng phần tử** (`whileInView` + `viewport.once`), không gắn trên cả lưới: trên điện thoại lưới dài hơn màn hình, gắn cả lưới thì các thẻ phía dưới đã chạy xong trước khi em cuộn tới.
- `useInView` chỉ gắn observer lúc mount: gắn ref lên phần tử **luôn được render** (section), không gắn lên phần tử chỉ hiện sau khi tải dữ liệu.

## 7. Điện thoại

- Breakpoint: **640px** (bố cục điện thoại), **560px** (thẻ voucher ngang), **900px** (hero 1 cột, lưới 2 cột).
- ≤640px: topbar chỉ còn logo (56px); điều hướng chuyển xuống **thanh tab dưới đáy** (💝 Voucher / 🌸 Về em / 💌 Đã gửi) có tôn trọng `safe-area-inset-bottom`; `SelectionBar` nổi phía trên thanh tab. Trang chừa 104px phía dưới (thanh tab ~74px + khoảng thở) để chữ cuối trang không dính vào thanh tab.
- Hero: hình minh hoạ thu nhỏ 220px và lên **trên** tiêu đề; nút CTA full width.
- Vùng chạm tối thiểu ~40px; tắt `-webkit-tap-highlight-color` vì đã có animation bấm riêng.
- Admin ≤640px: thanh tab dưới đáy có 5 tab (Voucher / Thông báo / Dịp lễ / Hồ sơ / Tài khoản), cuộn ngang được; tab đang mở tự cuộn vào giữa, mép phải có mask mờ để báo còn tab.
- DatePicker thành bottom sheet; mọi ô nhập vẫn 16px.
- Kiểm tra ở chiều rộng 390px (iPhone) trước khi coi một màn hình là xong.

## 8. Giọng văn

- Tiếng Việt, xưng **anh / em**, ngọt và hơi đùa: "Ôi, em đáng yêu quá đi!", "Hết lượt rồi 🥲", "Ước gì cũng được hết 💗".
- Thông báo lỗi cũng giữ giọng đó nhưng nói rõ việc cần làm: "Chọn ít nhất một voucher ở trên nha 👆".
- Emoji dùng như dấu câu, tối đa một cái mỗi câu.
- Phía admin nói thẳng và ngắn hơn ("Đã làm ✓", "Xoá thật?").
