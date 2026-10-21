import type { GreetingDto } from "@love/shared";
import { daysBetween, todayDateOnlyInVietnam } from "./dates.js";

// The daily scratch card: one greeting per Vietnam day. The list is shuffled once (fixed seed) and
// walked day by day, wrapping around, so the same greeting comes back only after every other one
// has been shown: exactly GREETINGS.length days apart. Pure function of the date: no storage.

const GREETINGS: readonly [emoji: string, text: string][] = [
  ["☀️", "Chào buổi sáng, cô gái của anh. Hôm nay nhớ cười thật nhiều nha!"],
  ["🌸", "Chúc em một ngày nhẹ nhàng như hoa, ngọt ngào như trà sữa full topping."],
  ["💕", "Hôm nay anh thương em nhiều hơn hôm qua một chút, và ít hơn ngày mai một chút."],
  ["🍀", "Chúc em hôm nay gặp toàn chuyện may, còn chuyện xui để anh lo."],
  ["🌈", "Dù trời có mưa thì em vẫn là cầu vồng của anh."],
  ["🧋", "Nhớ uống đủ nước nha, trà sữa không tính là nước đâu đó."],
  ["😴", "Tối nay ngủ sớm nha em, mơ thấy anh là được."],
  ["🌻", "Em là lý do anh mỉm cười mỗi sáng."],
  ["💪", "Hôm nay có khó khăn gì cũng không sao, em giỏi lắm mà."],
  ["🍰", "Chúc em một ngày ngọt hơn cả chiếc bánh kem em thích nhất."],
  ["✨", "Em không cần cố gắng hoàn hảo, với anh em đã đủ tuyệt rồi."],
  ["🐣", "Bé ngoan hôm nay nhớ ăn sáng đầy đủ nha."],
  ["🌙", "Ngày dài rồi, về nghỉ ngơi đi em. Anh luôn ở đây."],
  ["🎈", "Chúc em một ngày nhẹ tênh như quả bóng bay."],
  ["💌", "Có một người đang nghĩ về em đó. Là anh chứ ai."],
  ["🌷", "Mỗi ngày bên em đều là một ngày đẹp."],
  ["🫶", "Cảm ơn em vì đã ở bên anh. Hôm nay cũng vậy nhé."],
  ["🍓", "Em ngọt hơn dâu, xinh hơn hoa, đáng yêu hơn mèo."],
  ["☕", "Cà phê sáng có thể đắng, nhưng ngày của em thì phải ngọt."],
  ["🐱", "Hôm nay em đáng yêu đúng mức cho phép chưa? Hay lại vượt rồi?"],
  ["🎵", "Chúc em một ngày vui như bài hát em hay ngân nga."],
  ["🌊", "Mệt thì cứ dựa vào anh, anh vững lắm."],
  ["🍦", "Chúc em một ngày mát lành như cây kem giữa trưa hè."],
  ["🦋", "Em cứ bay thật cao, anh sẽ là gió đẩy em lên."],
  ["🌼", "Một ngày mới, một cơ hội mới để em tỏa sáng."],
  ["💖", "Anh không giỏi nói lời hay, nhưng anh thương em thật lòng."],
  ["🍜", "Hôm nay nhớ ăn trưa đúng giờ nha, đừng để bụng réo."],
  ["⭐", "Giữa hàng tỷ ngôi sao, anh vẫn chỉ nhìn thấy em."],
  ["🎀", "Chúc công chúa của anh một ngày dễ thương như chính em."],
  ["🌞", "Nắng hôm nay đẹp, nhưng nụ cười của em vẫn đẹp hơn."],
  ["🧸", "Nếu hôm nay mệt quá, nhớ là có một cái ôm đang chờ em."],
  ["🍫", "Chúc em một ngày ngọt như socola mà không lo béo."],
  ["🌺", "Em là bông hoa đẹp nhất trong khu vườn của anh."],
  ["📚", "Học hay làm gì cũng đừng quá sức nha, em quan trọng nhất."],
  ["🎁", "Mỗi ngày có em là một món quà anh không bao giờ chán mở."],
  ["🐼", "Ăn no, ngủ kỹ, cười tươi. Nhiệm vụ hôm nay của em chỉ vậy thôi."],
  ["💐", "Gửi em một bó hoa tưởng tượng, hoa thật để anh mang tới sau."],
  ["🌤️", "Trời có lúc âm u, nhưng anh sẽ luôn là nắng của em."],
  ["🍑", "Em là trái đào ngọt nhất mùa này."],
  ["💭", "Hôm nay anh lại nghĩ về em hơi nhiều, không biết làm sao."],
  ["🎶", "Em là giai điệu dễ thương nhất trong ngày của anh."],
  ["🌙", "Chúc em ngủ ngon, mai mình lại thương nhau tiếp."],
  ["🍬", "Một viên kẹo ngọt cho cô gái ngọt ngào."],
  ["🏆", "Em làm tốt lắm rồi, anh tự hào về em."],
  ["🦄", "Em là điều kỳ diệu có thật duy nhất anh từng gặp."],
  ["☁️", "Hôm nay đầu óc em hãy nhẹ như mây nhé."],
  ["🍵", "Một tách trà ấm, một ngày bình yên, một người thương em."],
  ["🌹", "Anh thích em hôm qua, thương em hôm nay, và yêu em mãi về sau."],
  ["😊", "Cười lên nào, em cười là cả thế giới của anh sáng lên."],
  ["🐰", "Em nhảy chân sáo đi làm hôm nay nha, vui lắm đó."],
  ["🌟", "Dù hôm nay ra sao, anh vẫn đứng về phía em."],
  ["🍉", "Chúc em một ngày tươi mát như dưa hấu ướp lạnh."],
  ["💞", "Hai đứa mình, một ngày nữa bên nhau. Thật vui."],
  ["🎨", "Hôm nay hãy tô cho ngày của em thật nhiều màu hồng."],
  ["🛌", "Ngủ đủ giấc nha em, quầng thâm không hợp với em đâu."],
  ["🌏", "Thế giới rộng lớn lắm, nhưng anh chỉ cần mình em."],
  ["🍪", "Nếu em buồn, ăn một chiếc bánh quy rồi gọi cho anh."],
  ["🌿", "Hít một hơi thật sâu, mọi chuyện sẽ ổn thôi."],
  ["🎉", "Chúc mừng em đã sống thêm một ngày đáng yêu!"],
  ["🫧", "Mong mọi muộn phiền hôm nay của em tan nhanh như bong bóng."],
  ["🌛", "Mặt trăng đêm nay đẹp, giống em."],
  ["🍯", "Ngọt như mật ong, đó là cách anh nghĩ về em."],
  ["👑", "Hôm nay em là nữ hoàng, anh là người hầu tận tụy."],
  ["💡", "Em là ý tưởng hay nhất mà cuộc đời từng có."],
  ["🐶", "Anh trung thành với em như cún với chủ vậy."],
  ["🍋", "Đời có chua một chút thì mình pha thành nước chanh."],
  ["🌅", "Mỗi bình minh đều nhắc anh rằng anh may mắn có em."],
  ["💝", "Hôm nay anh gửi em một chút yêu thương, mai gửi thêm."],
  ["🎠", "Chúc em một ngày vui như đi công viên giải trí."],
  ["🌧️", "Trời mưa thì nhớ mang ô, không có ô thì gọi anh."],
  ["🍡", "Em dễ thương như viên bánh trôi tròn tròn."],
  ["🔆", "Em tỏa sáng mà không cần cố gắng gì cả."],
  ["🎐", "Chúc tâm hồn em hôm nay trong trẻo như tiếng chuông gió."],
  ["🐝", "Hôm nay chăm chỉ như ong, nhưng nhớ nghỉ giải lao nha."],
  ["🍒", "Em là quả cherry trên chiếc bánh cuộc đời anh."],
  ["🌠", "Nếu được ước một điều, anh vẫn ước có em."],
  ["🤗", "Gửi em một cái ôm thật chặt qua màn hình."],
  ["🍩", "Chúc em một ngày tròn trịa và ngọt ngào như chiếc donut."],
  ["🏖️", "Ráng thêm chút nữa, cuối tuần mình đi chơi."],
  ["💗", "Trái tim anh hôm nay vẫn đập vì em, như mọi ngày."],
  ["🐧", "Lạnh thì mặc ấm nha em, đừng để bị cảm."],
  ["🌾", "Bình yên nhất là khi được ở cạnh em."],
  ["🍭", "Đời ngọt hay không là tùy, nhưng em thì chắc chắn ngọt."],
  ["📸", "Nếu hôm nay có bức ảnh đẹp nhất, đó là nụ cười của em."],
  ["🌻", "Hướng về phía mặt trời, như anh luôn hướng về em."],
  ["🥰", "Em có biết là em đáng yêu lắm không? Biết rồi thì thôi."],
  ["🎂", "Không cần sinh nhật, ngày nào có em cũng đáng ăn mừng."],
  ["🍀", "Chúc em may mắn trong mọi việc, kể cả việc chọn anh."],
  ["🌸", "Hoa nở là để đẹp, em sinh ra là để được yêu thương."],
  ["⏰", "Báo thức đã reo, công chúa dậy đi nào. Anh chờ tin nhắn đó."],
  ["🛍️", "Hôm nay muốn mua gì cứ mua, đã có anh lo."],
  ["🌈", "Sau cơn mưa trời lại sáng, sau giận hờn mình lại thương."],
  ["🍕", "Chúc em một ngày vui như được ăn pizza miếng to nhất."],
  ["💫", "Em là phép màu nhỏ xinh của anh mỗi ngày."],
  ["🦊", "Tinh nghịch một chút cũng được, miễn là em vui."],
  ["🌙", "Đi ngủ đi em, mai thức dậy lại có anh thương."],
  ["🍇", "Mỗi ngày bên em là một chùm niềm vui."],
  ["🎮", "Hôm nay em thắng mọi ván game, kể cả ván cãi nhau với anh."],
  ["❤️", "Không cần lý do, anh chỉ muốn nói anh thương em."],
  ["🧁", "Em là chiếc cupcake đáng yêu nhất thế giới."],
  ["🌳", "Có anh làm bóng mát, em cứ thong thả nha."],
  ["🎯", "Chúc em hôm nay làm gì cũng trúng đích."],
  ["🐳", "Anh thương em nhiều như đại dương, bao la không thấy bờ."],
  ["🥐", "Bữa sáng có thể đơn giản, nhưng lời chúc của anh thì phải đầy đủ."],
  ["🌺", "Hôm nay hãy dịu dàng với chính mình một chút nhé."],
  ["🎆", "Em làm cho ngày bình thường của anh trở nên rực rỡ."],
  ["😘", "Một nụ hôn gió gửi em, nhận lấy rồi cười đi."],
  ["🍊", "Chúc em tràn đầy năng lượng như ly nước cam buổi sáng."],
  ["🪐", "Ở hành tinh nào anh cũng sẽ tìm ra em."],
  ["🌷", "Mỗi ngày anh lại phát hiện thêm một lý do để thương em."],
  ["🎧", "Đeo tai nghe, mở bài em thích, và tận hưởng ngày hôm nay."],
  ["🫖", "Chậm lại một chút, uống tách trà, rồi mình tính tiếp."],
  ["🌞", "Chúc em một ngày rực rỡ, ấm áp và tràn đầy nụ cười."],
  ["💍", "Hôm nay anh vẫn chọn em, ngày mai cũng vậy."],
  ["🐨", "Muốn được ôm em như gấu koala ôm cây."],
  ["🌌", "Bầu trời đêm có nhiều sao, nhưng sáng nhất vẫn là em."],
  ["🍮", "Ngọt ngào và mềm mại, đó là trái tim em."],
  ["🎊", "Hôm nay là một ngày tuyệt vời, vì có em trong đó."],
  ["🤍", "Cảm ơn em đã là chính em. Anh thương em lắm."],
];

/** Small deterministic PRNG (mulberry32): the same cycle always shuffles the same way. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates with a fixed seed: a stable, non-alphabetical order of the list. */
const ORDER: readonly number[] = (() => {
  const random = seededRandom(20241014);
  const order = GREETINGS.map((_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
})();

// Day 0 of the rotation. Any fixed date works; it only has to never change.
const EPOCH = "2024-01-01";

export function greetingFor(date = todayDateOnlyInVietnam()): GreetingDto {
  const dayNumber = daysBetween(EPOCH, date);
  const position = ((dayNumber % ORDER.length) + ORDER.length) % ORDER.length;
  const [emoji, text] = GREETINGS[ORDER[position]!]!;
  return { date, emoji, text };
}

/** Exposed for the rotation check in development scripts. */
export const GREETING_COUNT = GREETINGS.length;
