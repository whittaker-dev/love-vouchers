import type { WishQuotaDto } from "@love/shared";
import { prisma } from "./db.js";
import { todayDateOnlyInVietnam } from "./dates.js";
import type { Prisma } from "./generated/prisma/client.js";
import { HttpError } from "./errors.js";

// She can send a limited number of wishes per calendar month (Vietnam time). The count lives in
// MonthlyUsage because handled wishes are deleted; cancelling a voucher does not give a send back.

function monthKey(today = todayDateOnlyInVietnam()): string {
  return today.slice(0, 7);
}

function firstDayOfNextMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return monthNumber === 12 ? `${year! + 1}-01-01` : `${year}-${String(monthNumber! + 1).padStart(2, "0")}-01`;
}

async function monthlyLimit(client: Prisma.TransactionClient | typeof prisma = prisma): Promise<number> {
  const settings = await client.appSetting.findUnique({ where: { id: 1 } });
  return settings?.monthlyWishLimit ?? 3;
}

export async function currentQuota(): Promise<WishQuotaDto> {
  const month = monthKey();
  const [limit, usage] = await Promise.all([
    monthlyLimit(),
    prisma.monthlyUsage.findUnique({ where: { month } }),
  ]);
  const used = usage?.wishCount ?? 0;
  return { month, limit, used, remaining: Math.max(0, limit - used), resetsOn: firstDayOfNextMonth(month) };
}

/**
 * Takes one send from this month's allowance inside the caller's transaction, or throws 409.
 * Check-and-increment is a single conditional UPDATE, so two sends at once cannot both get the last one.
 */
export async function consumeMonthlySend(tx: Prisma.TransactionClient): Promise<void> {
  const month = monthKey();
  const limit = await monthlyLimit(tx);
  await tx.monthlyUsage.upsert({ where: { month }, create: { month }, update: {} });
  const { count } = await tx.monthlyUsage.updateMany({
    where: { month, wishCount: { lt: limit } },
    data: { wishCount: { increment: 1 } },
  });
  if (count === 0) {
    const [year, monthNumber] = firstDayOfNextMonth(month).split("-");
    throw new HttpError(409, `Tháng này em gửi đủ ${limit} lần rồi, quay lại vào 1/${Number(monthNumber)}/${year} nha 💕`);
  }
}
