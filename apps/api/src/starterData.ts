import { VOUCHER_COLORS } from "@love/shared";

// Content created once on the first boot of a fresh database (see bootstrap.ts). After that the
// admin owns it: edits and deletes in the admin pages are never undone by a restart or redeploy.

const STARTER_VOUCHERS: { title: string; emoji: string; description: string }[] = [
  { title: "Trà sữa", emoji: "🧋", description: "Một ly trà sữa em thích nhất, topping thoải mái." },
  { title: "Matcha latte", emoji: "🍵", description: "Một ly matcha latte thơm béo cho buổi chiều của em." },
  { title: "Cà phê", emoji: "☕", description: "Một ly cà phê cho em tỉnh táo cả ngày, anh mang tới tận nơi." },
  { title: "Trà trái cây", emoji: "🍓", description: "Một ly trà trái cây mát lạnh, nhiều trái cây tươi." },
  { title: "Bánh ngọt", emoji: "🍰", description: "Một chiếc bánh ngọt xinh xinh để em ăn vặt." },
  { title: "Ăn vặt", emoji: "🍟", description: "Một bữa ăn vặt tuỳ em chọn, anh bao hết." },
  { title: "Kem", emoji: "🍦", description: "Một cây kem mát lạnh, vị nào cũng được." },
  { title: "Gà rán", emoji: "🍗", description: "Một phần gà rán giòn rụm, sốt chấm thật nhiều." },
  { title: "Pizza", emoji: "🍕", description: "Một chiếc pizza nóng hổi để hai đứa cùng ăn." },
  { title: "Tokbokki", emoji: "🌶️", description: "Một phần tokbokki cay cay, thêm chả cá." },
  { title: "Sushi", emoji: "🍣", description: "Một bữa sushi ngon lành ở quán em thích." },
  { title: "Lẩu", emoji: "🍲", description: "Một bữa lẩu nóng hổi: em gọi món, anh trả tiền." },
  { title: "Son môi", emoji: "💄", description: "Một thỏi son đúng màu em thích." },
  { title: "Skincare", emoji: "🧴", description: "Một món skincare em đang muốn mua." },
  { title: "Mỹ phẩm", emoji: "🛍️", description: "Một món mỹ phẩm em chọn, anh thanh toán." },
  { title: "Phụ kiện", emoji: "🎀", description: "Một món phụ kiện xinh xắn: kẹp tóc, vòng tay, khuyên tai…" },
  { title: "Mua đồ Shopee", emoji: "📦", description: "Một đơn Shopee em thích, anh trả tiền." },
  { title: "Voucher nail", emoji: "💅", description: "Một lần làm nail thật xinh." },
  { title: "Bắp nước xem phim", emoji: "🎬", description: "Bắp và nước cho một buổi xem phim cùng nhau." },
  { title: "Quỹ đi chơi", emoji: "🎡", description: "Một khoản quỹ cho chuyến đi chơi tiếp theo của hai đứa." },
  { title: "Hoa tươi", emoji: "💐", description: "Một bó hoa tươi giao tận tay em." },
  { title: "Gấu bông", emoji: "🧸", description: "Một bạn gấu bông để em ôm khi anh không ở bên." },
  { title: "Sách mới", emoji: "📚", description: "Một cuốn sách mới em đang muốn đọc." },
  { title: "Một chiếc váy", emoji: "👗", description: "Một chiếc váy em ưng ý nhất." },
  { title: "Một buổi shopping", emoji: "🛍️", description: "Một buổi đi shopping: anh xách đồ, không than mệt." },
  { title: "Massage", emoji: "💆", description: "Một buổi massage vai, cổ, lưng thật thư giãn." },
  { title: "Ôm miễn phí", emoji: "🫂", description: "Một cái ôm thật chặt, bất cứ lúc nào em cần." },
  { title: "Hôn một cái", emoji: "😘", description: "Một nụ hôn, đổi ngay lập tức." },
  { title: "Một buổi hẹn hò", emoji: "💗", description: "Một buổi hẹn hò anh lên kế hoạch từ A đến Z." },
  { title: "Quà bất ngờ", emoji: "🎁", description: "Một món quà bất ngờ, em chỉ việc chờ thôi." },
];

/** Rows for prisma.voucher.createMany: unlimited uses, colours cycled so the grid looks varied. */
export function starterVoucherRows() {
  return STARTER_VOUCHERS.map((voucher, index) => ({
    ...voucher,
    color: VOUCHER_COLORS[index % VOUCHER_COLORS.length]!,
    quantity: null,
    sortOrder: index,
  }));
}

export const STARTER_PROFILE = {
  name: "Bé Yêu",
  nickname: "Bé",
  avatarEmoji: "🐐",
  bio: "Người con gái đáng yêu nhất thế giới.",
  favorites: ["Trà sữa", "Phim Hàn", "Mèo", "Đi biển"],
};
