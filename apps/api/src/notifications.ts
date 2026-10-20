import { prisma } from "./db.js";
import { HttpError } from "./errors.js";

// Wishes are the admin's notifications. Handling one deletes it rather than flagging it, so the
// database only ever holds what still needs doing. The one thing that must survive deletion,
// how many times a voucher was used, lives in Voucher.usedCount.

type Outcome = "done" | "cancel";

/**
 * Removes one pending voucher from a wish. "cancel" gives the use back to the voucher;
 * "done" keeps it counted. The wish itself goes once its last item is gone.
 */
export async function resolveRedemption(id: string, outcome: Outcome): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const item = await tx.redemption.findUnique({ where: { id } });
    if (!item) throw new HttpError(404, "Thông báo này đã được xử lý rồi");

    await tx.redemption.delete({ where: { id } });
    if (outcome === "cancel" && item.voucherId) {
      // updateMany: the voucher may have been deleted meanwhile (voucherId is then null anyway).
      await tx.voucher.updateMany({
        where: { id: item.voucherId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    const remaining = await tx.redemption.count({ where: { requestId: item.requestId } });
    if (remaining === 0) await tx.wishRequest.delete({ where: { id: item.requestId } });
  });
}

/** "Xong hết": every voucher in the wish is done; the wish and its items are deleted. */
export async function completeWish(id: string): Promise<void> {
  // Items cascade with the wish; their uses stay counted.
  const { count } = await prisma.wishRequest.deleteMany({ where: { id } });
  if (count === 0) throw new HttpError(404, "Thông báo này đã được xử lý rồi");
}
