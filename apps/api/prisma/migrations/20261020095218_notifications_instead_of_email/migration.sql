-- Notifications instead of email: a redemption now exists only while pending, so the number of
-- uses must be stored on the voucher before finished rows can be deleted.

-- 1. Count every use made so far (cancelled ones gave their use back).
ALTER TABLE "Voucher" ADD COLUMN "usedCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Voucher" AS v
SET "usedCount" = counts.used
FROM (
  SELECT "voucherId", COUNT(*)::INTEGER AS used
  FROM "Redemption"
  WHERE "status" <> 'CANCELLED' AND "voucherId" IS NOT NULL
  GROUP BY "voucherId"
) AS counts
WHERE v."id" = counts."voucherId";

-- 2. Handled rows are no longer kept; then drop wishes left with no items.
DELETE FROM "Redemption" WHERE "status" <> 'PENDING';
DELETE FROM "WishRequest" AS w
WHERE NOT EXISTS (SELECT 1 FROM "Redemption" AS r WHERE r."requestId" = w."id");

-- 3. Columns that only made sense with statuses and email.
DROP INDEX "Redemption_voucherId_status_idx";
ALTER TABLE "Redemption" DROP COLUMN "fulfilledAt", DROP COLUMN "status";
ALTER TABLE "WishRequest" DROP COLUMN "emailError", DROP COLUMN "emailSentAt";
DROP TYPE "RedemptionStatus";

CREATE INDEX "Redemption_voucherId_idx" ON "Redemption"("voucherId");
